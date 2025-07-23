"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Medical History schema for validation
const medicalHistorySchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  allergies: z.array(z.string()).default([]),
  chronicDiseases: z.array(z.string()).default([]),
  pastSurgeries: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const medicalHistoryCreateSchema = medicalHistorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const medicalHistoryUpdateSchema = medicalHistoryCreateSchema.partial();

export async function getMedicalHistories() {
  try {
    const medicalHistories = await prisma.medicalHistory.findMany({
      include: {
        patient: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return { success: true, data: medicalHistories };
  } catch (error) {
    console.error('Error fetching medical histories:', error);
    return { success: false, error: 'Failed to fetch medical histories' };
  }
}

export async function getMedicalHistoryById(id: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { id },
      include: {
        patient: true,
      }
    });
    
    if (!medicalHistory) {
      return { success: false, error: 'Medical history not found' };
    }
    
    return { success: true, data: medicalHistory };
  } catch (error) {
    console.error('Error fetching medical history by ID:', error);
    return { success: false, error: 'Failed to fetch medical history' };
  }
}

export async function getMedicalHistoryByPatient(patientId: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: medicalHistory };
  } catch (error) {
    console.error('Error fetching medical history by patient:', error);
    return { success: false, error: 'Failed to fetch patient medical history' };
  }
}

export async function createMedicalHistory(data: z.infer<typeof medicalHistoryCreateSchema>) {
  try {
    const validatedData = medicalHistoryCreateSchema.parse(data);
    
    // Check if medical history already exists for this patient
    const existingHistory = await prisma.medicalHistory.findUnique({
      where: { patientId: validatedData.patientId }
    });
    
    if (existingHistory) {
      return { success: false, error: 'Medical history already exists for this patient' };
    }
    
    const medicalHistory = await prisma.medicalHistory.create({
      data: validatedData,
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: medicalHistory };
  } catch (error) {
    console.error('Error creating medical history:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create medical history' };
  }
}

export async function updateMedicalHistory(id: string, data: z.infer<typeof medicalHistoryUpdateSchema>) {
  try {
    const validatedData = medicalHistoryUpdateSchema.parse(data);
    
    const medicalHistory = await prisma.medicalHistory.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: medicalHistory };
  } catch (error) {
    console.error('Error updating medical history:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update medical history' };
  }
}

export async function updateMedicalHistoryByPatient(patientId: string, data: z.infer<typeof medicalHistoryUpdateSchema>) {
  try {
    const validatedData = medicalHistoryUpdateSchema.parse(data);
    
    // Try to update existing record, or create new one if it doesn't exist
    const medicalHistory = await prisma.medicalHistory.upsert({
      where: { patientId },
      update: validatedData,
      create: {
        ...validatedData,
        patientId
      },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: medicalHistory };
  } catch (error) {
    console.error('Error updating medical history by patient:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update medical history' };
  }
}

export async function deleteMedicalHistory(id: string) {
  try {
    await prisma.medicalHistory.delete({
      where: { id }
    });
    
    return { success: true, message: 'Medical history deleted successfully' };
  } catch (error) {
    console.error('Error deleting medical history:', error);
    return { success: false, error: 'Failed to delete medical history' };
  }
}

export async function addAllergy(patientId: string, allergy: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId }
    });
    
    if (!medicalHistory) {
      return { success: false, error: 'Medical history not found for this patient' };
    }
    
    const updatedAllergies = [...medicalHistory.allergies, allergy];
    
    const updated = await prisma.medicalHistory.update({
      where: { patientId },
      data: { allergies: updatedAllergies },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error adding allergy:', error);
    return { success: false, error: 'Failed to add allergy' };
  }
}

export async function removeAllergy(patientId: string, allergy: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId }
    });
    
    if (!medicalHistory) {
      return { success: false, error: 'Medical history not found for this patient' };
    }
    
    const updatedAllergies = medicalHistory.allergies.filter(a => a !== allergy);
    
    const updated = await prisma.medicalHistory.update({
      where: { patientId },
      data: { allergies: updatedAllergies },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error removing allergy:', error);
    return { success: false, error: 'Failed to remove allergy' };
  }
}

export async function addMedication(patientId: string, medication: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId }
    });
    
    if (!medicalHistory) {
      return { success: false, error: 'Medical history not found for this patient' };
    }
    
    const updatedMedications = [...medicalHistory.medications, medication];
    
    const updated = await prisma.medicalHistory.update({
      where: { patientId },
      data: { medications: updatedMedications },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error adding medication:', error);
    return { success: false, error: 'Failed to add medication' };
  }
}

export async function removeMedication(patientId: string, medication: string) {
  try {
    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId }
    });
    
    if (!medicalHistory) {
      return { success: false, error: 'Medical history not found for this patient' };
    }
    
    const updatedMedications = medicalHistory.medications.filter(m => m !== medication);
    
    const updated = await prisma.medicalHistory.update({
      where: { patientId },
      data: { medications: updatedMedications },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error removing medication:', error);
    return { success: false, error: 'Failed to remove medication' };
  }
}

