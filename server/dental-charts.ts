"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

// Tooth annotation schema - removed notes property
const toothAnnotationSchema = z.object({
  toothNumber: z.number(),
  diseases: z.array(z.string()),
});

// Dental Chart schema for validation
const dentalChartSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  toothAnnotations: z.array(toothAnnotationSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const dentalChartCreateSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string(),
  toothAnnotations: z.array(toothAnnotationSchema),
});

const dentalChartUpdateSchema = z.object({
  toothAnnotations: z.array(toothAnnotationSchema),
});

export async function getDentalCharts() {
  try {
    const dentalCharts = await prisma.dentalChart.findMany({
      include: {
        patient: true,
        dentist: true,
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    return { success: true, data: dentalCharts };
  } catch (error) {
    console.error('Error fetching dental charts:', error);
    return { success: false, error: 'Failed to fetch dental charts' };
  }
}

export async function getDentalChartById(id: string) {
  try {
    const dentalChart = await prisma.dentalChart.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: true,
      }
    });
    
    if (!dentalChart) {
      return { success: false, error: 'Dental chart entry not found' };
    }
    
    return { success: true, data: dentalChart };
  } catch (error) {
    console.error('Error fetching dental chart by ID:', error);
    return { success: false, error: 'Failed to fetch dental chart entry' };
  }
}

export async function getDentalChartsByPatient(patientId: string) {
  try {
    // Validate patientId
    if (!patientId || typeof patientId !== 'string') {
      return { success: false, error: 'Invalid patient ID' };
    }

    const dentalCharts = await prisma.dentalChart.findMany({
      where: { patientId },
      include: {
        dentist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: dentalCharts };
  } catch (error) {
    console.error('Error fetching dental charts by patient:', error);
    return { success: false, error: 'Failed to fetch patient dental charts' };
  }
}

export async function createDentalChartDB(
  patientId: string, 
  dentistId: string, 
  toothAnnotations: Array<{
    toothNumber: number;
    diseases: string[];
  }>
) {
  try {
    // Validate input data
    const validationResult = dentalChartCreateSchema.safeParse({
      patientId,
      dentistId,
      toothAnnotations,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { success: false, error: 'Invalid data provided' };
    }

    // Check if patient and dentist exist
    const [patient, dentist] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.staff.findUnique({ where: { id: dentistId } })
    ]);

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    if (!dentist) {
      return { success: false, error: 'Dentist not found' };
    }

    // Create the dental chart
    const dentalChart = await prisma.dentalChart.create({
      data: {
        patientId,
        dentistId,
        toothAnnotations: toothAnnotations as any, // Prisma handles JSON serialization
      },
      include: {
        patient: true,
        dentist: true,
      },
    });
    
    return { success: true, data: dentalChart };
  } catch (error) {
    console.error('Error creating dental chart:', error);
    return { success: false, error: 'Failed to create dental chart entry' };
  }
}

export async function updateDentalChart(
  id: string, 
  toothAnnotations: Array<{
    toothNumber: number;
    diseases: string[];
  }>
) {
  try {
    // Validate input data
    const validationResult = dentalChartUpdateSchema.safeParse({
      toothAnnotations,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { success: false, error: 'Invalid data provided' };
    }

    // Check if dental chart exists
    const existingChart = await prisma.dentalChart.findUnique({
      where: { id }
    });

    if (!existingChart) {
      return { success: false, error: 'Dental chart not found' };
    }

    // Update the dental chart
    const dentalChart = await prisma.dentalChart.update({
      where: { id },
      data: {
        toothAnnotations: toothAnnotations as any, // Prisma handles JSON serialization
      },
      include: {
        patient: true,
        dentist: true,
      },
    });
    
    return { success: true, data: dentalChart };
  } catch (error) {
    console.error("Error updating dental chart:", error);
    return { success: false, error: "Failed to update dental chart entry" };
  }
}

export async function deleteDentalChart(id: string) {
  try {
    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid dental chart ID' };
    }

    // Check if dental chart exists
    const existingChart = await prisma.dentalChart.findUnique({
      where: { id }
    });

    if (!existingChart) {
      return { success: false, error: 'Dental chart not found' };
    }

    // Delete the dental chart
    await prisma.dentalChart.delete({
      where: { id }
    });
    
    return { success: true, message: 'Dental chart entry deleted successfully' };
  } catch (error) {
    console.error('Error deleting dental chart:', error);
    return { success: false, error: 'Failed to delete dental chart entry' };
  }
}

export async function getDentalChartsByDentist(dentistId: string) {
  try {
    // Validate dentistId
    if (!dentistId || typeof dentistId !== 'string') {
      return { success: false, error: 'Invalid dentist ID' };
    }

    const dentalCharts = await prisma.dentalChart.findMany({
      where: { dentistId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: dentalCharts };
  } catch (error) {
    console.error('Error fetching dental charts by dentist:', error);
    return { success: false, error: 'Failed to fetch dentist dental charts' };
  }
}

export async function getPatientDentalSummary(patientId: string) {
  try {
    // Validate patientId
    if (!patientId || typeof patientId !== 'string') {
      return { success: false, error: 'Invalid patient ID' };
    }

    const dentalCharts = await prisma.dentalChart.findMany({
      where: { patientId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Create a summary of the latest annotations
    const latestChart = dentalCharts[0];
    const summary = {
      totalCharts: dentalCharts.length,
      latestChart: latestChart || null,
      lastUpdated: latestChart?.updatedAt || null,
      charts: dentalCharts
    };
    
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching patient dental summary:', error);
    return { success: false, error: 'Failed to fetch patient dental summary' };
  }
}

export async function searchDentalCharts(query: string) {
  try {
    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return { success: false, error: 'Invalid search query' };
    }

    const dentalCharts = await prisma.dentalChart.findMany({
      where: {
        OR: [
          {
            patient: {
              firstName: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          },
          {
            patient: {
              lastName: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          },
          {
            dentist: {
              firstName: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          },
          {
            dentist: {
              lastName: {
                contains: query.trim(),
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        patient: true,
        dentist: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: dentalCharts };
  } catch (error) {
    console.error('Error searching dental charts:', error);
    return { success: false, error: 'Failed to search dental charts' };
  }
}

