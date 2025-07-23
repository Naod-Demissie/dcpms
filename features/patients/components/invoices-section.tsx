"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, DollarSign, Calendar, Download, Printer } from "lucide-react";
import { InvoiceDialog } from "./invoice-dialog";
import { getInvoicesByPatient, updateInvoiceStatus } from "@/server/invoices";
import { generateInvoicePDFServerAction } from "@/server/invoices";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";

interface InvoicesSectionProps {
  patientId: string;
}

export function InvoicesSection({ patientId }: InvoicesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInvoicesByPatient(patientId);
      if (result.success && result.data) {
        setInvoices(result.data);
      } else {
        setInvoices([]);
        setError(result.error || "Failed to fetch invoices");
      }
    } catch (e) {
      setInvoices([]);
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [patientId, isDialogOpen]);

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "PARTIAL":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "UNPAID":
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unpaid</Badge>;
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status !== "PAID").reduce((sum, invoice) => sum + ((invoice.totalAmount || 0) - (invoice.paidAmount || 0)), 0);

  const handleViewPDF = async (invoice: any) => {
    try {
      const pdfBuffer = await generateInvoicePDFServerAction(invoice.id);
      if (!pdfBuffer) throw new Error("No PDF generated");
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("Invoice PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleMarkPaid = async (invoice: any) => {
    try {
      const result = await updateInvoiceStatus(invoice.id, "PAID");
      if (result.success) {
        toast.success("Invoice marked as paid");
        fetchInvoices();
      } else {
        toast.error(result.error || "Failed to mark as paid");
      }
    } catch (e) {
      toast.error("Failed to mark as paid");
    }
  };

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const pdfBuffer = await generateInvoicePDFServerAction(invoice.id);
      if (!pdfBuffer) throw new Error("No PDF generated");
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handlePrintPDF = async (invoice: any) => {
    try {
      const pdfBuffer = await generateInvoicePDFServerAction(invoice.id);
      if (!pdfBuffer) throw new Error("No PDF generated");
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success("Invoice sent to printer");
    } catch (error) {
      console.error("Error printing PDF:", error);
      toast.error("Failed to print PDF");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Invoices</CardTitle>
          <CardDescription>Billing and payment history</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
        {/* Invoices List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading invoices...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-1">Generate an invoice to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
              <div
                key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={e => {
                    // Only trigger if not clicking on a button or menu
                    if ((e.target as HTMLElement).closest('button, [role="menu"]')) return;
                    handleViewPDF(invoice);
                  }}
                  tabIndex={0}
                  role="button"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleViewPDF(invoice);
                  }}
                  aria-label={`View invoice ${invoice.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-primary">{invoice.id || 'Unknown'}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                          <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>
                        {invoice.patient && (
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold">{invoice.patient.firstName} {invoice.patient.lastName}</span>
                          </div>
                        )}
                      </div>
                      {invoice.description && (
                        <div className="text-xs text-muted-foreground mt-1">{invoice.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewPDF(invoice)}>
                          <Eye className="mr-2 h-4 w-4" /> View PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintPDF(invoice)}>
                          <Printer className="mr-2 h-4 w-4" /> Print PDF
                        </DropdownMenuItem>
                        {invoice.status !== "PAID" && (
                          <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
                            <DollarSign className="mr-2 h-4 w-4" /> Mark Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setEditingInvoice(invoice)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingInvoice(invoice)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              </div>
          )}
        </div>
      </CardContent>
      <InvoiceDialog
        isOpen={isDialogOpen || !!editingInvoice}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingInvoice(null);
        }}
        patientId={patientId}
        editingInvoice={editingInvoice}
        onEditSuccess={() => {
          setEditingInvoice(null);
          fetchInvoices();
        }}
      />
    </Card>
  );
}

