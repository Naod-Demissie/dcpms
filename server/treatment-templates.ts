"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Treatment Template schema for validation
const treatmentTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  estimatedCost: z.number().min(0).optional().nullable(),
  durationMinutes: z.number().min(0).optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const treatmentTemplateCreateSchema = treatmentTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const treatmentTemplateUpdateSchema = treatmentTemplateCreateSchema.partial();

export async function getTreatmentTemplates() {
  try {
    const templates = await prisma.treatmentTemplate.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error('Error fetching treatment templates:', error);
    return { success: false, error: 'Failed to fetch treatment templates' };
  }
}

export async function getTreatmentTemplateById(id: string) {
  try {
    const template = await prisma.treatmentTemplate.findUnique({
      where: { id },
      include: {
        treatments: {
          include: {
            patient: true,
            treatedBy: true
          }
        }
      }
    });
    
    if (!template) {
      return { success: false, error: 'Treatment template not found' };
    }
    
    return { success: true, data: template };
  } catch (error) {
    console.error('Error fetching treatment template by ID:', error);
    return { success: false, error: 'Failed to fetch treatment template' };
  }
}

export async function createTreatmentTemplate(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = treatmentTemplateCreateSchema.parse({
      ...data,
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost as string) : undefined,
      durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes as string) : undefined,
    });
    
    const template = await prisma.treatmentTemplate.create({
      data: validatedData
    });
    revalidatePath("/treatment-templates");
    
    return { success: true, data: template };
  } catch (error) {
    console.error('Error creating treatment template:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create treatment template' };
  }
}

export async function updateTreatmentTemplate(id: string, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const validatedData = treatmentTemplateUpdateSchema.parse({
      ...data,
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost as string) : undefined,
      durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes as string) : undefined,
    });
    
    const template = await prisma.treatmentTemplate.update({
      where: { id },
      data: validatedData
    });
    revalidatePath("/treatment-templates");
    
    return { success: true, data: template };
  } catch (error) {
    console.error('Error updating treatment template:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update treatment template' };
  }
}

export async function deleteTreatmentTemplate(id: string) {
  try {
    // Check if template is being used by any treatments
    const treatmentsUsingTemplate = await prisma.treatment.findMany({
      where: { templateId: id }
    });
    
    if (treatmentsUsingTemplate.length > 0) {
      return { success: false, error: 'Cannot delete template that is being used by treatments' };
    }
    
    await prisma.treatmentTemplate.delete({
      where: { id }
    });
    revalidatePath("/treatment-templates");
    
    return { success: true, message: 'Treatment template deleted successfully' };
  } catch (error) {
    console.error('Error deleting treatment template:', error);
    return { success: false, error: 'Failed to delete treatment template' };
  }
}
