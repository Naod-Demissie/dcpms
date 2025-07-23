"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Document schema for validation
export type Document = z.infer<typeof documentSchema>;

const documentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileUrl: z.string().url("Invalid file URL"),
  uploadDate: z.date(),
  notes: z.string().optional().nullable(),
});

const documentCreateSchema = documentSchema.omit({
  id: true,
  uploadDate: true,
});

const documentUpdateSchema = documentCreateSchema.partial();

export async function getDocuments() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        patient: true,
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { success: false, error: 'Failed to fetch documents' };
  }
}

export async function getDocumentById(id: string) {
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        patient: true,
      }
    });
    
    if (!document) {
      return { success: false, error: 'Document not found' };
    }
    
    return { success: true, data: document };
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return { success: false, error: 'Failed to fetch document' };
  }
}

export async function createDocument(data: z.infer<typeof documentCreateSchema>) {
  try {
    const validatedData = documentCreateSchema.parse(data);
    
    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });
    
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }
    
    const document = await prisma.document.create({
      data: {
        ...validatedData,
        uploadDate: new Date()
      },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: document };
  } catch (error) {
    console.error('Error creating document:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create document' };
  }
}

export async function updateDocument(id: string, data: z.infer<typeof documentUpdateSchema>) {
  try {
    const validatedData = documentUpdateSchema.parse(data);
    
    const document = await prisma.document.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: document };
  } catch (error) {
    console.error('Error updating document:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update document' };
  }
}

export async function deleteDocument(id: string) {
  try {
    await prisma.document.delete({
      where: { id }
    });
    
    return { success: true, message: 'Document deleted successfully' };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

export async function getDocumentsByPatient(patientId: string) {
  try {
    const documents = await prisma.document.findMany({
      where: { patientId },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error fetching documents by patient:', error);
    return { success: false, error: 'Failed to fetch patient documents' };
  }
}

export async function getDocumentsByFileType(fileType: string) {
  try {
    const documents = await prisma.document.findMany({
      where: { fileType },
      include: {
        patient: true,
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error fetching documents by file type:', error);
    return { success: false, error: 'Failed to fetch documents by file type' };
  }
}

export async function getDocumentsByDateRange(startDate: Date, endDate: Date) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        uploadDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error fetching documents by date range:', error);
    return { success: false, error: 'Failed to fetch documents for date range' };
  }
}

export async function searchDocuments(searchTerm: string) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          {
            fileName: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            notes: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            patient: {
              OR: [
                {
                  firstName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                },
                {
                  lastName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        patient: true,
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error searching documents:', error);
    return { success: false, error: 'Failed to search documents' };
  }
}

export async function getDocumentStats() {
  try {
    const totalDocuments = await prisma.document.count();
    
    const documentsByType = await prisma.document.groupBy({
      by: ['fileType'],
      _count: {
        id: true
      }
    });
    
    const recentDocuments = await prisma.document.count({
      where: {
        uploadDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    const stats = {
      totalDocuments,
      documentsByType: documentsByType.reduce((acc, item) => {
        acc[item.fileType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentDocuments
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return { success: false, error: 'Failed to fetch document statistics' };
  }
}

export async function bulkDeleteDocuments(documentIds: string[]) {
  try {
    await prisma.document.deleteMany({
      where: {
        id: {
          in: documentIds
        }
      }
    });
    
    return { success: true, message: `${documentIds.length} documents deleted successfully` };
  } catch (error) {
    console.error('Error bulk deleting documents:', error);
    return { success: false, error: 'Failed to bulk delete documents' };
  }
}

export async function updateDocumentNotes(id: string, notes: string) {
  try {
    const document = await prisma.document.update({
      where: { id },
      data: { notes },
      include: {
        patient: true,
      }
    });
    
    return { success: true, data: document };
  } catch (error) {
    console.error('Error updating document notes:', error);
    return { success: false, error: 'Failed to update document notes' };
  }
}
