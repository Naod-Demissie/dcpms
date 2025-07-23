"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getTreatmentsByPatient } from "@/server/treatments";
import { createInvoice } from "@/server/invoices";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateInvoicePDFServerAction } from "@/server/invoices";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);

type Treatment = {
  id: string;
  patientId: string;
  name: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  price: number;
  template?: { id: string; name: string };
};

type InvoiceTreatment = Treatment & {
  includeVat: boolean;
  vatAmount: number;
  paymentStatus: "full" | "partial" | "unpaid";
  paidAmount: number;
  notes: string;
  vatPercent: number;
};

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  editingInvoice?: any; // New: for editing existing invoice
  onEditSuccess?: () => void; // New: callback after edit
}

export function InvoiceDialog({ isOpen, onClose, patientId, editingInvoice, onEditSuccess }: InvoiceDialogProps) {
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceTreatments, setInvoiceTreatments] = useState<InvoiceTreatment[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [pdfModal, setPdfModal] = useState<{ open: boolean; pdfDataUri: string | null; invoiceId?: string }>({ open: false, pdfDataUri: null });

  // Helper functions for PDF operations
  const downloadPDF = (dataUri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = (dataUri: string) => {
    const printWindow = window.open(dataUri, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Clear invoiceTreatments on dialog open, or prefill if editing
  React.useEffect(() => {
    if (isOpen) {
      if (editingInvoice) {
        // Prefill from editingInvoice
        setInvoiceTreatments(
          (editingInvoice.treatments || []).map((t: any) => ({
            id: t.treatmentId || t.id,
            patientId: patientId,
            name: t.name,
            description: t.description,
            date: t.date,
            createdAt: t.createdAt || t.date,
            updatedAt: t.updatedAt || t.date,
            notes: t.notes || '',
            price: t.basePrice ?? t.price ?? 0,
            includeVat: t.includeVat ?? false,
            vatAmount: t.vatAmount ?? 0,
            vatPercent: t.vatPercent ?? 0,
            paymentStatus: t.paymentStatus ?? 'unpaid',
            paidAmount: t.paidAmount ?? 0,
          }))
        );
        setExpandedIndex(null);
      } else {
        setInvoiceTreatments([]);
        setExpandedIndex(null);
      }
    }
  }, [isOpen, editingInvoice, patientId]);

  // Fetch treatments for patient
  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getTreatmentsByPatient(patientId)
      .then((result) => {
        if (result.success && result.data) {
          setAvailableTreatments(
            result.data.map((t: any) => ({
              id: t.id,
              patientId: t.patientId,
              name: t.treatmentType || (t.template && t.template.name) || t.name || "",
              description: t.description || undefined,
              date: t.date || t.createdAt,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              notes: t.notes || undefined,
              price: t.cost || 0,
            }))
          );
        } else {
          setAvailableTreatments([]);
          setError(result.error || "Failed to fetch treatments");
          toast.error(result.error || "Failed to fetch treatments");
        }
      })
      .catch((e) => {
        setAvailableTreatments([]);
        setError("Failed to fetch treatments");
        toast.error("Failed to fetch treatments");
      })
      .finally(() => setLoading(false));
  }, [isOpen, patientId]);

  const addTreatmentToInvoice = (treatment: Treatment) => {
    if (invoiceTreatments.some((t) => t.id === treatment.id)) return;
    setInvoiceTreatments((prev) => [
      ...prev,
      {
        ...treatment,
        price: treatment.price ?? 100, // fallback price
        includeVat: false,
        vatAmount: 0,
        vatPercent: 0,
        paymentStatus: "unpaid",
        paidAmount: 0,
        notes: "",
      },
    ]);
    setExpandedIndex(invoiceTreatments.length);
  };

  const updateTreatment = (idx: number, changes: Partial<InvoiceTreatment> & { vatPercent?: number }) => {
    setInvoiceTreatments((prev) =>
      prev.map((t, i) => {
        if (i !== idx) return t;
        let paidAmount = t.paidAmount;
        let vatAmount = t.vatAmount;
        let vatPercent = changes.vatPercent !== undefined ? changes.vatPercent : (t as any).vatPercent || 0;
        // Only set paidAmount to 0 if status is changing to 'partial' from something else and no paidAmount is provided
        if (
          changes.paymentStatus === "full"
        ) {
          paidAmount = t.price ?? 0;
        } else if (
          changes.paymentStatus === "partial" &&
          t.paymentStatus !== "partial" &&
          changes.paidAmount === undefined
        ) {
          paidAmount = 0;
        } else if (changes.paymentStatus === "unpaid") {
          paidAmount = 0;
        } else if (typeof changes.paidAmount === "number") {
          paidAmount = changes.paidAmount;
        }
        if (changes.vatPercent !== undefined) {
          vatAmount = t.price * (changes.vatPercent / 100);
        } else if (changes.vatAmount !== undefined) {
          vatAmount = changes.vatAmount;
        }
        return { ...t, ...changes, paidAmount, vatAmount, vatPercent };
      })
    );
  };

  const removeTreatment = (idx: number) => {
    setInvoiceTreatments((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIndex(null);
  };

  const calculateTotal = () =>
    invoiceTreatments.reduce(
      (sum, t) => sum + (t.price ?? 0) + (t.includeVat ? t.vatAmount : 0),
      0
    );

  const validate = () => {
    const newErrors: Record<number, string> = {};
    invoiceTreatments.forEach((t, idx) => {
      if (t.includeVat && (!t.vatAmount || t.vatAmount < 0)) {
        newErrors[idx] = "VAT amount required and must be >= 0";
      }
      if (t.paymentStatus === "partial" && (!t.paidAmount || t.paidAmount < 0)) {
        newErrors[idx] = "Enter paid amount for partial payment";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update the handleSubmit function to work with the new JSON structure
  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      // Transform the treatments data to match the new JSON structure
      const treatmentsData = invoiceTreatments.map((treatment) => ({
        id: treatment.id,
        treatmentId: treatment.id, // Reference to original treatment
        name: treatment.name,
        description: treatment.description,
        date: new Date(treatment.date).toISOString(), // Convert to ISO string
        basePrice: treatment.price,
        includeVat: treatment.includeVat,
        vatPercent: (treatment as any).vatPercent || 0,
        vatAmount: treatment.includeVat ? treatment.price * ((treatment as any).vatPercent || 0) / 100 : 0,
        paymentStatus: treatment.paymentStatus,
        paidAmount: treatment.paidAmount,
        notes: treatment.notes,
        totalAmount: treatment.price + (treatment.includeVat ? treatment.price * ((treatment as any).vatPercent || 0) / 100 : 0),
      }));

      // Calculate invoice totals
      const subtotal = invoiceTreatments.reduce((sum, t) => sum + t.price, 0);
      const vatTotal = invoiceTreatments.reduce((sum, t) => 
        sum + (t.includeVat ? t.price * ((t as any).vatPercent || 0) / 100 : 0), 0
      );
      const totalAmount = subtotal + vatTotal;
      const paidAmount = invoiceTreatments.reduce((sum, t) => sum + t.paidAmount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const invoiceData = {
        patientId,
        treatments: treatmentsData,
        subtotal,
        vatTotal,
        totalAmount,
        paidAmount,
        pendingAmount,
        status: "UNPAID" as const, // Fix: ensure correct union type
      };

      // If editing, call updateInvoice, else createInvoice
      let result;
      if (editingInvoice && editingInvoice.id) {
        const { updateInvoice } = await import("@/server/invoices");
        result = await updateInvoice(editingInvoice.id, invoiceData);
      } else {
        result = await createInvoice(invoiceData);
      }

      if (result.success && result.data) {
        toast.success(editingInvoice ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        if (editingInvoice && onEditSuccess) onEditSuccess();
        // Generate PDF using new server action
        const invoice = result.data;
        try {
          const pdfBuffer = await generateInvoicePDFServerAction(invoice.id);
          if (pdfBuffer) {
            const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
            const pdfDataUri = URL.createObjectURL(blob);
            setPdfModal({ open: true, pdfDataUri, invoiceId: invoice.id });
          } else {
            toast.error('Failed to generate PDF');
          }
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate PDF');
        }
        setInvoiceTreatments([]);
        setExpandedIndex(null);
        onClose();
      } else {
        toast.error(result.error || (editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice'));
      }
    } catch (error) {
      console.error('Error creating/updating invoice:', error);
      toast.error(editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice');
    }
  };

  const filteredTreatments = availableTreatments.filter(
    (t) =>
      t.name.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
      format(new Date(t.date), "yyyy-MM-dd").includes(treatmentSearch)
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Add treatments, VAT, and payment details for this invoice.
          </DialogDescription>
        </DialogHeader>
        {/* Treatment Search Dropdown */}
        <div className="mb-4 w-full">
          <Select
            onValueChange={id => {
              const treatment = availableTreatments.find(t => t.id === id);
              if (treatment) {
                addTreatmentToInvoice(treatment);
              }
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search and select treatment..." />
            </SelectTrigger>
            <SelectContent className="w-full">
              {loading && (
                <SelectItem disabled value="loading" className="w-full text-gray-500">
                  Loading treatments...
                </SelectItem>
              )}
              {!loading && availableTreatments.length === 0 && (
                <SelectItem disabled value="no-treatments" className="w-full text-gray-500">
                  No treatments found for this patient
                </SelectItem>
              )}
              {availableTreatments.map(t => (
                <SelectItem key={t.id} value={t.id} className="w-full">
                  {t.name} ({format(new Date(t.date), "yyyy-MM-dd")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <div className="p-2 text-red-500 text-sm">{error}</div>}
        </div>
        {/* Accordion for Treatments */}
        <div className="space-y-2">
          {invoiceTreatments.map((treatment, idx) => (
            <Collapsible
              key={treatment.id}
              open={expandedIndex === idx}
              onOpenChange={(open) => setExpandedIndex(open ? idx : null)}
            >
              <div className="border rounded bg-muted/40 shadow">
                <div
                  className="flex items-center justify-between px-4 py-2 cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                >
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIndex(expandedIndex === idx ? null : idx);
                        }}
                      >
                        {expandedIndex === idx ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <span className="font-medium">{treatment.name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(treatment.date), "yyyy-MM-dd")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTreatment(idx);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <div className="p-4 space-y-3">
                    {/* Payment Status and Paid Amount */}
                    <div className="flex gap-4 items-center w-full">
                      <label className="w-32">Payment Status:</label>
                      <div className="flex-1 min-w-0">
                        <Select
                          value={treatment.paymentStatus}
                          onValueChange={(val) =>
                            updateTreatment(idx, {
                              paymentStatus: val as "full" | "partial" | "unpaid",
                              paidAmount:
                                val === "full"
                                  ? (treatment as any).price ?? 0
                                  : 0,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Fully Paid</SelectItem>
                            <SelectItem value="partial">Partially Paid</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center">
                        <label className="mr-2 whitespace-nowrap">Paid Amount:</label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={
                            treatment.paymentStatus === "full"
                              ? (treatment as any).price ?? 0
                              : treatment.paymentStatus === "unpaid"
                              ? 0
                                : treatment.paidAmount === 0
                                ? ""
                              : treatment.paidAmount
                          }
                            readOnly={treatment.paymentStatus === "full" || treatment.paymentStatus === "unpaid" ? true : false}
                            disabled={treatment.paymentStatus !== "partial" ? true : false}
                            onFocus={e => {
                              if (treatment.paymentStatus === "partial" && (treatment.paidAmount === 0 || treatment.paidAmount === undefined)) {
                                updateTreatment(idx, { paidAmount: undefined });
                              }
                            }}
                            onBlur={e => {
                              if (treatment.paymentStatus === "partial" && (e.target.value === "" || e.target.value === null)) {
                                updateTreatment(idx, { paidAmount: 0 });
                              }
                            }}
                          onChange={(e) =>
                            updateTreatment(idx, {
                                paidAmount: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="ml-1 text-xs">ETB</span>
                      </div>
                    </div>
                    {/* VAT Toggle */}
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        checked={treatment.includeVat}
                        onCheckedChange={(checked) =>
                          updateTreatment(idx, { includeVat: !!checked })
                        }
                        id={`vat-toggle-${treatment.id}`}
                      />
                      <label htmlFor={`vat-toggle-${treatment.id}`}>Include VAT</label>
                      {treatment.includeVat && (
                        <>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={
                              (treatment as any).vatPercent === 0 || (treatment as any).vatPercent === undefined
                                ? ""
                                : (treatment as any).vatPercent
                            }
                            onChange={(e) =>
                              updateTreatment(idx, {
                                vatPercent: e.target.value === "" ? 0 : Number(e.target.value),
                              })
                            }
                            placeholder=""
                            className="w-20 ml-2"
                          />
                          <span className="ml-1 text-xs">%</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({formatCurrency(treatment.includeVat ? treatment.price * ((treatment as any).vatPercent || 0) / 100 : 0)})
                          </span>
                        </>
                      )}
                    </div>
                    {/* Notes */}
                    <div>
                      <label>Notes:</label>
                      <Textarea
                        value={treatment.notes}
                        onChange={(e) =>
                          updateTreatment(idx, { notes: e.target.value })
                        }
                        placeholder="Notes for this treatment"
                      />
                    </div>
                    {/* Amount Summary */}
                    <div className="flex gap-4 text-sm mt-2">
                      <span>Base: {formatCurrency((treatment as any).price ?? 0)}</span>
                      <span>VAT: {treatment.includeVat ? formatCurrency(treatment.price * ((treatment as any).vatPercent || 0) / 100) : "ETB 0.00"}</span>
                      <span>Total: {formatCurrency((treatment as any).price + (treatment.includeVat ? treatment.vatAmount : 0))}</span>
                    </div>
                    {errors[idx] && <div className="text-red-500 text-xs mt-1">{errors[idx]}</div>}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
        {/* Invoice Summary Table */}
        <div className="mt-4 border-t pt-4">
          <div className="font-semibold mb-2">Summary</div>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="border-b">
                <th className="text-left">Treatment</th>
                <th>Date</th>
                <th>Base</th>
                <th>VAT</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoiceTreatments.map((t, idx) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{format(new Date(t.date), "yyyy-MM-dd")}</td>
                  <td>{formatCurrency((t as any).price ?? 0)}</td>
                  <td>{t.includeVat ? formatCurrency(t.price * ((t as any).vatPercent || 0) / 100) : "ETB 0.00"}</td>
                  <td>{formatCurrency((t as any).price + (t.includeVat ? t.vatAmount : 0))}</td>
                  <td>{t.paymentStatus === "full" ? "Paid" : t.paymentStatus === "partial" ? "Partial" : "Unpaid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Calculate summary values */}
          {(() => {
            const total = invoiceTreatments.reduce(
              (sum, t) => sum + (t.price ?? 0) + (t.includeVat ? t.vatAmount : 0),
              0
            );
            const paid = invoiceTreatments.reduce((sum, t) => sum + (t.paidAmount ?? 0), 0);
            const pending = total - paid;
            return (
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Paid</span>
                  <span>{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Pending</span>
                  <span>{formatCurrency(pending)}</span>
                </div>
              </div>
            );
          })()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={invoiceTreatments.length === 0}>
            Save Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      {/* PDF Modal for download/print after creation */}
      <Dialog open={pdfModal.open} onOpenChange={open => setPdfModal({ open, pdfDataUri: open ? pdfModal.pdfDataUri : null })}>
        <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col items-center" showCloseButton>
          {pdfModal.pdfDataUri && (
            <>
              <div className="flex gap-2 mb-2 w-full justify-end">
                <Button size="sm" variant="secondary" onClick={() => downloadPDF(pdfModal.pdfDataUri!, `invoice-${pdfModal.invoiceId || ''}.pdf`)}>
                  Download PDF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => printPDF(pdfModal.pdfDataUri!)}>
                  Print PDF
                </Button>
              </div>
              <iframe
                src={pdfModal.pdfDataUri}
                title="Invoice PDF"
                className="w-full h-full border rounded bg-white"
                style={{ minHeight: 600 }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


