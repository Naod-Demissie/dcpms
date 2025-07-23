"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';
import { fillInvoicePDF, InvoicePDFData } from '@/lib/fill-invoice-pdf';

// TypeScript types for the treatment JSON structure
export interface InvoiceTreatment {
  id: string;
  treatmentId: string; // Reference to the original treatment
  name: string;
  description?: string;
  date: string;
  basePrice: number;
  includeVat: boolean;
  vatPercent: number;
  vatAmount: number;
  paymentStatus: "full" | "partial" | "unpaid";
  paidAmount: number;
  notes: string;
  totalAmount: number; // basePrice + vatAmount
}

// Helper function to generate custom invoice ID
function generateInvoiceId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `INV-${year}-${timestamp}`;
}

// Invoice schema for validation
const invoiceSchema = z.object({
  id: z.string(), // Custom format, not UUID
  patientId: z.string().uuid(),
  treatments: z.array(z.object({
    id: z.string(),
    treatmentId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    date: z.string(),
    basePrice: z.number().positive(),
    includeVat: z.boolean(),
    vatPercent: z.number().min(0).max(100),
    vatAmount: z.number().min(0),
    paymentStatus: z.enum(["full", "partial", "unpaid"]),
    paidAmount: z.number().min(0),
    notes: z.string(),
    totalAmount: z.number().positive(),
  })),
  subtotal: z.number().positive(),
  vatTotal: z.number().min(0),
  totalAmount: z.number().positive(),
  paidAmount: z.number().min(0),
  pendingAmount: z.number().min(0),
  status: z.enum(["UNPAID", "PAID", "PARTIAL"]).default("UNPAID"),
  createdById: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const invoiceCreateSchema = invoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const invoiceUpdateSchema = invoiceCreateSchema.partial();

// Helper function to calculate invoice totals from treatments
function calculateInvoiceTotals(treatments: InvoiceTreatment[]) {
  const subtotal = treatments.reduce((sum, t) => sum + t.basePrice, 0);
  const vatTotal = treatments.reduce((sum, t) => sum + (t.includeVat ? t.vatAmount : 0), 0);
  const totalAmount = subtotal + vatTotal;
  const paidAmount = treatments.reduce((sum, t) => sum + t.paidAmount, 0);
  const pendingAmount = totalAmount - paidAmount;
  
  return {
    subtotal,
    vatTotal,
    totalAmount,
    paidAmount,
    pendingAmount,
    status: (pendingAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID") as "UNPAID" | "PAID" | "PARTIAL"
  };
}

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        patient: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: 'Failed to fetch invoices' };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        createdBy: true,
      }
    });
    
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}

export async function createInvoice(data: z.infer<typeof invoiceCreateSchema>) {
  try {
    const validatedData = invoiceCreateSchema.parse(data);
    
    // Generate custom invoice ID
    const invoiceId = generateInvoiceId();
    
    // Calculate totals from treatments
    const totals = calculateInvoiceTotals(validatedData.treatments);
    
    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        patientId: validatedData.patientId,
        treatments: validatedData.treatments as any, // Store as JSON
        createdById: validatedData.createdById,
        ...totals,
      },
      include: {
        patient: true,
        createdBy: true,
      }
    });
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create invoice' };
  }
}

export async function updateInvoice(id: string, data: z.infer<typeof invoiceUpdateSchema>) {
  try {
    const validatedData = invoiceUpdateSchema.parse(data);
    
    // If treatments are being updated, recalculate totals
    let totals = {};
    if (validatedData.treatments) {
      totals = calculateInvoiceTotals(validatedData.treatments);
    }
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...validatedData,
        treatments: validatedData.treatments ? (validatedData.treatments as any) : undefined, // Store as JSON
        ...totals,
      },
      include: {
        patient: true,
        createdBy: true,
      }
    });
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update invoice' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: { id }
    });
    
    return { success: true, message: 'Invoice deleted successfully' };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: 'Failed to delete invoice' };
  }
}

export async function getInvoicesByPatient(patientId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { patientId },
      include: {
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices by patient:', error);
    return { success: false, error: 'Failed to fetch patient invoices' };
  }
}

export async function getInvoicesByStatus(status: "UNPAID" | "PAID" | "PARTIAL") {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status },
      include: {
        patient: true,
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices by status:', error);
    return { success: false, error: 'Failed to fetch invoices by status' };
  }
}

export async function addTreatmentToInvoice(invoiceId: string, treatment: InvoiceTreatment) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Parse existing treatments
    let treatments: InvoiceTreatment[] = [];
    if (typeof invoice.treatments === 'string') {
      treatments = JSON.parse(invoice.treatments) as InvoiceTreatment[];
    } else if (Array.isArray(invoice.treatments)) {
      treatments = invoice.treatments as unknown as InvoiceTreatment[];
    }

    // Add new treatment
    treatments.push(treatment);

    // Calculate new totals
    const totals = calculateInvoiceTotals(treatments);

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        treatments: treatments as any,
        ...totals
      }
    });

    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('Error adding treatment to invoice:', error);
    return { success: false, error: 'Failed to add treatment to invoice' };
  }
}

export async function removeTreatmentFromInvoice(invoiceId: string, treatmentId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Parse existing treatments
    let treatments: InvoiceTreatment[] = [];
    if (typeof invoice.treatments === 'string') {
      treatments = JSON.parse(invoice.treatments) as InvoiceTreatment[];
    } else if (Array.isArray(invoice.treatments)) {
      treatments = invoice.treatments as unknown as InvoiceTreatment[];
    }

    // Remove treatment
    treatments = treatments.filter(t => t.id !== treatmentId);

    // Calculate new totals
    const totals = calculateInvoiceTotals(treatments);

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        treatments: treatments as any,
        ...totals
      }
    });

    return { success: true, data: updatedInvoice };
  } catch (error) {
    console.error('Error removing treatment from invoice:', error);
    return { success: false, error: 'Failed to remove treatment from invoice' };
  }
}

export async function updateInvoiceStatus(id: string, status: "UNPAID" | "PAID" | "PARTIAL", paymentMethod?: "CASH" | "CREDIT_CARD" | "BANK_TRANSFER" | "MOBILE_MONEY" | "OTHER") {
  try {
    const updateData: any = { status };
    
    if (status === "PAID") {
      updateData.paidAt = new Date();
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }
    }
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        createdBy: true
      }
    });
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { success: false, error: 'Failed to update invoice status' };
  }
}

export async function getInvoicesByDateRange(startDate: Date, endDate: Date) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices by date range:', error);
    return { success: false, error: 'Failed to fetch invoices for date range' };
  }
}

/**
 * Server action to generate an invoice PDF by invoice ID.
 * @param id - Invoice ID
 * @returns Buffer (PDF file) or null if not found/error
 */
export async function generateInvoicePDFServerAction(id: string): Promise<Buffer | null> {
  // Fetch invoice with patient and createdBy
  const result = await getInvoiceById(id);
  if (!result.success || !result.data) return null;
  const invoice = result.data;

  // Parse treatments from JSON - handle both string and object cases
  let treatments: InvoiceTreatment[] = [];
  try {
    if (typeof invoice.treatments === 'string') {
      treatments = JSON.parse(invoice.treatments) as InvoiceTreatment[];
    } else if (Array.isArray(invoice.treatments)) {
      treatments = invoice.treatments as unknown as InvoiceTreatment[];
    }
  } catch (error) {
    console.error('Error parsing treatments:', error);
    treatments = [];
  }

  console.log('Parsed treatments:', treatments);
  console.log('Invoice data:', invoice);

  // Prepare PDF data with proper field mapping
  const pdfData: InvoicePDFData = {
    'date-field': invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '',
    'invoice-id-field': invoice.id,
    'name-field': invoice.patient?.firstName && invoice.patient?.lastName 
      ? `${invoice.patient.firstName} ${invoice.patient.lastName}` 
      : invoice.patient?.firstName || invoice.patient?.lastName || '',
    'phone-field': invoice.patient?.phoneNumber || '',
    // Row numbers for 'no-X' fields (1, 2, 3, 4, 5)
    'no-1': treatments.length > 0 ? '1' : '',
    'no-2': treatments.length > 1 ? '2' : '',
    'no-3': treatments.length > 2 ? '3' : '',
    'no-4': treatments.length > 3 ? '4' : '',
    'no-5': treatments.length > 4 ? '5' : '',
    // Treatment descriptions
    'description-1': treatments[0]?.name || '',
    'description-2': treatments[1]?.name || '',
    'description-3': treatments[2]?.name || '',
    'description-4': treatments[3]?.name || '',
    'description-5': treatments[4]?.name || '',
    // Prices
    'price-1': treatments[0]?.basePrice?.toFixed(2) || '',
    'price-2': treatments[1]?.basePrice?.toFixed(2) || '',
    'price-3': treatments[2]?.basePrice?.toFixed(2) || '',
    'price-4': treatments[3]?.basePrice?.toFixed(2) || '',
    'price-5': treatments[4]?.basePrice?.toFixed(2) || '',
    // Quantities (only set for existing treatments)
    'qty-1': treatments[0] ? '1' : '',
    'qty-2': treatments[1] ? '1' : '',
    'qty-3': treatments[2] ? '1' : '',
    'qty-4': treatments[3] ? '1' : '',
    'qty-5': treatments[4] ? '1' : '',
    // Totals
    'total-1': treatments[0]?.totalAmount?.toFixed(2) || '',
    'total-2': treatments[1]?.totalAmount?.toFixed(2) || '',
    'total-3': treatments[2]?.totalAmount?.toFixed(2) || '',
    'total-4': treatments[3]?.totalAmount?.toFixed(2) || '',
    'total-5': treatments[4]?.totalAmount?.toFixed(2) || '',
    'subtotal-field': invoice.subtotal?.toFixed(2) || '',
    'taxrate-field': invoice.vatTotal?.toFixed(2) || '',
    'grandtotal-field': invoice.totalAmount?.toFixed(2) || '',
    'dr-name-field': invoice.createdBy?.firstName && invoice.createdBy?.lastName 
      ? `${invoice.createdBy.firstName} ${invoice.createdBy.lastName}` 
      : invoice.createdBy?.firstName || invoice.createdBy?.lastName || ''
  };

  console.log('PDF Data being sent:', pdfData);

  try {
    const pdfBytes = await fillInvoicePDF(pdfData);
    return Buffer.from(pdfBytes);
  } catch (e) {
    console.error('Error generating invoice PDF:', e);
    return null;
  }
}
