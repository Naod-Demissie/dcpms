"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';
import { fillPrescriptionPDF, PrescriptionData } from '@/lib/fill-prescription-pdf';
 

// Function to generate custom prescription ID
function generatePrescriptionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RX-${id}`;
}

// Prescription schema for validation
const prescriptionSchema = z.object({
  id: z.string(), // Custom RX-XXXX format
  patientId: z.string().uuid(),
  prescribedById: z.string(),
  details: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string(),
  })), // Array of prescriptions in one batch
  issuedAt: z.date(),
});

const prescriptionCreateSchema = prescriptionSchema.omit({
  id: true,
  issuedAt: true,
});

const prescriptionUpdateSchema = prescriptionCreateSchema.partial();

export async function createPrescription(data: z.infer<typeof prescriptionCreateSchema>) {
  try {
    const validatedData = prescriptionCreateSchema.parse(data);
    
    // Generate unique prescription ID
    let prescriptionId: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      prescriptionId = generatePrescriptionId();
      const existing = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return { success: false, error: 'Failed to generate unique prescription ID' };
    }
    
    const prescription = await prisma.prescription.create({
      data: {
        id: prescriptionId!,
        patientId: validatedData.patientId,
        prescribedById: validatedData.prescribedById,
        details: validatedData.details,
        issuedAt: new Date()
      },
      include: {
        patient: true,
        prescribedBy: true,
      }
    });
    return { success: true, data: prescription };
  } catch (error) {
    console.error('Error creating prescription:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create prescription' };
  }
}

export async function getPrescriptions() {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        patient: true,
        prescribedBy: true,
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    return { success: true, data: prescriptions };
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return { success: false, error: 'Failed to fetch prescriptions' };
  }
}

export async function getPrescriptionById(id: string) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        prescribedBy: true,
      }
    });
    
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }
    
    return { success: true, data: prescription };
  } catch (error) {
    console.error('Error fetching prescription by ID:', error);
    return { success: false, error: 'Failed to fetch prescription' };
  }
}

export async function updatePrescription(id: string, data: z.infer<typeof prescriptionUpdateSchema>) {
  try {
    const validatedData = prescriptionUpdateSchema.parse(data);
    const prescription = await prisma.prescription.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        prescribedBy: true,
      }
    });
    return { success: true, data: prescription };
  } catch (error) {
    console.error('Error updating prescription:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update prescription' };
  }
}

export async function deletePrescription(id: string) {
  try {
    // Get prescription details before deletion for file cleanup
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        prescribedBy: true,
      }
    });
    
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }
    
    // Delete the prescription from database
    await prisma.prescription.delete({
      where: { id }
    });
    
    // Note: In a real application, you would also delete the associated PDF file here
    // For now, we'll just return success as the PDF is generated on-demand
    
    return { success: true, message: 'Prescription deleted successfully' };
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return { success: false, error: 'Failed to delete prescription' };
  }
}

export async function getPrescriptionsByPatient(patientId: string) {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        prescribedBy: true,
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    
    return { success: true, data: prescriptions };
  } catch (error) {
    console.error('Error fetching prescriptions by patient:', error);
    return { success: false, error: 'Failed to fetch patient prescriptions' };
  }
}

export async function getPrescriptionsByStaff(staffId: string) {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { prescribedById: staffId },
      include: {
        patient: true,
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    
    return { success: true, data: prescriptions };
  } catch (error) {
    console.error('Error fetching prescriptions by staff:', error);
    return { success: false, error: 'Failed to fetch staff prescriptions' };
  }
}

export async function getPrescriptionsByDateRange(startDate: Date, endDate: Date) {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        issuedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
        prescribedBy: true,
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
    
    return { success: true, data: prescriptions };
  } catch (error) {
    console.error('Error fetching prescriptions by date range:', error);
    return { success: false, error: 'Failed to fetch prescriptions for date range' };
  }
}

/**
 * Server action to generate a prescription PDF by prescription ID.
 * @param id - Prescription ID
 * @returns Buffer (PDF file) or null if not found/error
 */
type PrescriptionWithRelations = Omit<z.infer<typeof prescriptionSchema>, 'details'> & {
  details?: Array<{
    medication?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  patient?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    subcity?: string;
    city?: string;
  };
  prescribedBy?: {
    firstName?: string;
    lastName?: string;
  };
};

export async function generatePrescriptionPDFServerAction(id: string): Promise<Buffer | null> {
  // Fetch prescription with patient and prescribedBy
  const result = await getPrescriptionById(id);
  if (!result.success || !result.data) return null;
  const prescription = result.data as unknown as PrescriptionWithRelations;

  // Helper to calculate age from dateOfBirth
  function getAge(dateOfBirth?: Date): string {
    if (!dateOfBirth) return '';
    const diff = Date.now() - new Date(dateOfBirth).getTime();
    const ageDt = new Date(diff);
    return String(Math.abs(ageDt.getUTCFullYear() - 1970));
  }

  // Map DB data to the correct PrescriptionData for the template
  const pdfData: PrescriptionData = {
    'name-field': [prescription.patient?.firstName, prescription.patient?.lastName].filter(Boolean).join(' '),
    'age-field': getAge(prescription.patient?.dateOfBirth),
    'sex-field': prescription.patient?.gender || '',
    'address-field': [prescription.patient?.subcity, prescription.patient?.city].filter(Boolean).join(', ') || '',
    'medicine-1': prescription.details?.[0]?.medication || '',
    'medicine-2': prescription.details?.[1]?.medication || '',
    'medicine-3': prescription.details?.[2]?.medication || '',
    'medicine-4': prescription.details?.[3]?.medication || '',
    'date-field': prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleDateString() : '',
    'presciption-id-field': prescription.id,
    'doctor-name-field': [prescription.prescribedBy?.firstName, prescription.prescribedBy?.lastName].filter(Boolean).join(' '),
  };

  try {
    const pdfBytes = await fillPrescriptionPDF(pdfData);
    return Buffer.from(pdfBytes);
  } catch (e) {
    console.error('Error generating prescription PDF:', e);
    return null;
  }
}
