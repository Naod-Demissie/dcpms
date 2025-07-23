"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Treatment schema for validation
const treatmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  treatmentType: z.string().min(1, "Treatment type is required"),
  templateId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  date: z.date().optional().nullable(),
  cost: z.number().positive().optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
  treatedById: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const treatmentCreateSchema = treatmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  templateId: true,
});

const treatmentUpdateSchema = treatmentCreateSchema.partial();

export async function getTreatments() {
  try {
    const treatments = await prisma.treatment.findMany({
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return { success: true, data: treatments };
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return { success: false, error: 'Failed to fetch treatments' };
  }
}

export async function getTreatmentById(id: string) {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      }
    });
    
    if (!treatment) {
      return { success: false, error: 'Treatment not found' };
    }
    
    return { success: true, data: treatment };
  } catch (error) {
    console.error('Error fetching treatment by ID:', error);
    return { success: false, error: 'Failed to fetch treatment' };
  }
}

export async function createTreatment(data: z.infer<typeof treatmentCreateSchema>) {
  try {
    const validatedData = treatmentCreateSchema.parse(data);
    
    const treatment = await prisma.treatment.create({
      data: validatedData,
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      }
    });
    
    return { success: true, data: treatment };
  } catch (error) {
    console.error('Error creating treatment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create treatment' };
  }
}

export async function updateTreatment(id: string, data: z.infer<typeof treatmentUpdateSchema>) {
  try {
    const validatedData = treatmentUpdateSchema.parse(data);
    
    const treatment = await prisma.treatment.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      }
    });
    
    return { success: true, data: treatment };
  } catch (error) {
    console.error('Error updating treatment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update treatment' };
  }
}

export async function deleteTreatment(id: string) {
  try {
    await prisma.treatment.delete({
      where: { id }
    });
    
    return { success: true, message: 'Treatment deleted successfully' };
  } catch (error) {
    console.error('Error deleting treatment:', error);
    return { success: false, error: 'Failed to delete treatment' };
  }
}

export async function getTreatmentsByPatient(patientId: string) {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { patientId },
      include: {
        appointment: true,
        template: true,
        treatedBy: true,
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return { success: true, data: treatments };
  } catch (error) {
    console.error('Error fetching treatments by patient:', error);
    return { success: false, error: 'Failed to fetch patient treatments' };
  }
}

export async function getTreatmentsByAppointment(appointmentId: string) {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { appointmentId },
      include: {
        patient: true,
        template: true,
        treatedBy: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return { success: true, data: treatments };
  } catch (error) {
    console.error('Error fetching treatments by appointment:', error);
    return { success: false, error: 'Failed to fetch appointment treatments' };
  }
}

export async function getTreatmentsByStaff(staffId: string) {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { treatedById: staffId },
      include: {
        patient: true,
        appointment: true,
        template: true,
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return { success: true, data: treatments };
  } catch (error) {
    console.error('Error fetching treatments by staff:', error);
    return { success: false, error: 'Failed to fetch staff treatments' };
  }
}

export async function updateTreatmentStatus(id: string, status: "PLANNED" | "IN_PROGRESS" | "COMPLETED") {
  try {
    const treatment = await prisma.treatment.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      }
    });
    
    return { success: true, data: treatment };
  } catch (error) {
    console.error('Error updating treatment status:', error);
    return { success: false, error: 'Failed to update treatment status' };
  }
}

export async function getTreatmentsByStatus(status: "PLANNED" | "IN_PROGRESS" | "COMPLETED") {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { status },
      include: {
        patient: true,
        appointment: true,
        template: true,
        treatedBy: true,
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    return { success: true, data: treatments };
  } catch (error) {
    console.error('Error fetching treatments by status:', error);
    return { success: false, error: 'Failed to fetch treatments by status' };
  }
}

