"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  Edit,
  Trash2,
} from "lucide-react";
import {
  getInvoices,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoicePDFServerAction,
} from "@/server/invoices";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InvoiceDialog } from "@/features/patients/components/invoice-dialog";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Paid", value: "PAID" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Unpaid", value: "UNPAID" },
];

function InvoicesPageContent() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await getInvoices();
      if (res.success) {
        setInvoices(res.data || []);
      } else {
        setInvoices([]);
        toast.error(res.error || "Failed to fetch invoices");
      }
    } catch {
      setInvoices([]);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filtered and searched invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    if (status !== "all") {
      filtered = filtered.filter((inv) => inv.status === status);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((inv) => {
        const patientName = inv.patient
          ? `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase()
          : "";
        const id = (inv.id || "").toLowerCase();
        const treatments = (inv.treatments || [])
          .map((t: any) => t.name?.toLowerCase() || "")
          .join(" ");
        return (
          patientName.includes(s) || id.includes(s) || treatments.includes(s)
        );
      });
    }
    return filtered;
  }, [invoices, status, search]);

  // Table setup for pagination
  const columns = useMemo<ColumnDef<any>[]>(
    () => [{ accessorKey: "id", header: "ID" }],
    []
  );
  const table = useReactTable({
    data: filteredInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  // Format helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  const formatDate = (date: string | Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
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

  // PDF, Mark Paid, Edit, Delete logic
  const handleView = async (invoice: any) => {
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

  const handleDownload = async (invoice: any) => {
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

  const handlePrint = async (invoice: any) => {
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

  const handleMarkPaid = async (invoice: any) => {
    try {
      const result = await updateInvoiceStatus(invoice.id, "PAID");
      if (result.success) {
        toast.success("Invoice marked as paid");
        fetchInvoices();
      } else {
        toast.error(result.error || "Failed to mark as paid");
      }
    } catch {
      toast.error("Failed to mark as paid");
    }
  };

  const handleEdit = (invoice: any) => setEditingInvoice(invoice);

  const handleDelete = (invoice: any) => setDeletingInvoice(invoice);

  const confirmDelete = async () => {
    if (!deletingInvoice) return;
    try {
      const result = await deleteInvoice(deletingInvoice.id);
      if (result.success) {
        toast.success("Invoice deleted successfully");
        setDeletingInvoice(null);
        fetchInvoices();
      } else {
        toast.error(result.error || "Failed to delete invoice");
      }
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Browse and manage all invoices.
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <Input
          placeholder="Search by patient, ID, or treatment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            Loading invoices...
          </span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {table.getRowModel().rows.map((row) => {
            const invoice = row.original;
            return (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary">
                        {invoice.id || "Unknown"}
                      </span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(invoice.createdAt)}</span>
                      </div>
                      {invoice.patient && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold">
                            {invoice.patient.firstName}{" "}
                            {invoice.patient.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(invoice)}>
                        <Eye className="mr-2 h-4 w-4" /> View PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                        <Printer className="mr-2 h-4 w-4" /> Print PDF
                      </DropdownMenuItem>
                      {invoice.status !== "PAID" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkPaid(invoice)}
                        >
                          <DollarSign className="mr-2 h-4 w-4" /> Mark Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(invoice)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <DataTablePagination table={table} />

      {/* Edit Dialog */}
      <InvoiceDialog
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        patientId={editingInvoice?.patientId || ""}
        editingInvoice={editingInvoice}
        onEditSuccess={() => {
          setEditingInvoice(null);
          fetchInvoices();
        }}
      />

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingInvoice}
        onOpenChange={(open) => {
          if (!open) setDeletingInvoice(null);
        }}
      >
        <DialogContent className="max-w-md">
          <div className="flex flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Delete Invoice</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete invoice{" "}
                <strong>{deletingInvoice?.id}</strong>? This action cannot be
                undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingInvoice(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div>Loading Invoices...</div>}>
      <InvoicesPageContent />
    </Suspense>
  );
}
