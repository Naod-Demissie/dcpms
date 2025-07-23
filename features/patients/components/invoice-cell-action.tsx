import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye, Download, Printer } from "lucide-react";
import { generateInvoicePDFServerAction } from '@/server/invoices';
import { toast } from "sonner";

interface InvoiceCellActionProps {
  invoice: any;
  onEdit: (invoice: any) => void;
  onDelete: (invoice: any) => void;
}

// Utility to fetch the PDF buffer from the server action
async function fetchInvoicePDFBuffer(invoiceId: string): Promise<Uint8Array | null> {
  try {
    // @ts-ignore
    const buffer = await generateInvoicePDFServerAction(invoiceId);
    return buffer;
  } catch (e) {
    return null;
  }
}

export const InvoiceCellAction: React.FC<InvoiceCellActionProps> = ({ 
  invoice, 
  onEdit, 
  onDelete 
}) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Safety check
  if (!invoice) {
    return null;
  }

  const handleViewPDF = async () => {
    try {
      const buffer = await fetchInvoicePDFBuffer(invoice.id);
      if (!buffer) throw new Error('No PDF generated');
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('Invoice PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const buffer = await fetchInvoicePDFBuffer(invoice.id);
      if (!buffer) throw new Error('No PDF generated');
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrintPDF = async () => {
    try {
      const buffer = await fetchInvoicePDFBuffer(invoice.id);
      if (!buffer) throw new Error('No PDF generated');
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Invoice sent to printer');
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast.error('Failed to print PDF');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(invoice)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewPDF}>
            <Eye className="mr-2 h-4 w-4" />
            View PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrintPDF}>
            <Printer className="mr-2 h-4 w-4" />
            Print PDF
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(invoice)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

