"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    


// Appointment schema for validation
const appointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  dentistId: z.string().nullable().optional(),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).default("SCHEDULED"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const appointmentCreateSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.union([z.string(), z.literal("none")]).nullable().optional().transform(e => e === "none" ? null : e),
  startTime: z.date(),
  endTime: z.date(),                      
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).default("SCHEDULED"),
});

const appointmentUpdateSchema = z.object({
  patientId: z.string().uuid().optional(),
  dentistId: z.union([z.string(), z.literal("none")]).nullable().optional().transform(e => e === "none" ? null : e),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
});

export async function getAppointments() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        dentist: true,
        treatments: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { success: false, error: 'Failed to fetch appointments' };
  }
}

export async function getAppointmentById(id: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: true,
        treatments: true,
      }
    });
    
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }
    
    return { success: true, data: appointment };
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    return { success: false, error: 'Failed to fetch appointment' };
  }
}

export async function createAppointment(data: z.infer<typeof appointmentCreateSchema>) {
  try {
    const validatedData = appointmentCreateSchema.parse(data);
    
    // Check for scheduling conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        dentistId: validatedData.dentistId,
        status: {
          in: ["SCHEDULED", "CONFIRMED"]
        },
        OR: [
          {
            AND: [
              { startTime: { lte: validatedData.startTime } },
              { endTime: { gt: validatedData.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: validatedData.endTime } },
              { endTime: { gte: validatedData.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: validatedData.startTime } },
              { endTime: { lte: validatedData.endTime } }
            ]
          }
        ]
      }
    });
    
    if (conflictingAppointment) {
      return { success: false, error: 'Time slot conflicts with existing appointment' };
    }
    
    const appointment = await prisma.appointment.create({
      data: validatedData,
      include: {
        patient: true,
        dentist: true,
      }
    });
    
    return { success: true, data: appointment };
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create appointment' };
  }
}

export async function updateAppointment(id: string, data: z.infer<typeof appointmentUpdateSchema>) {
  try {
    const validatedData = appointmentUpdateSchema.parse(data);
    
    // If updating time, check for conflicts
    if (validatedData.startTime || validatedData.endTime || validatedData.dentistId) {
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!existingAppointment) {
        return { success: false, error: 'Appointment not found' };
      }
      
      const startTime = validatedData.startTime || existingAppointment.startTime;
      const endTime = validatedData.endTime || existingAppointment.endTime;
      const dentistId = validatedData.dentistId !== undefined ? validatedData.dentistId : existingAppointment.dentistId;
      
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          dentistId: dentistId,
          status: {
            in: ["SCHEDULED", "CONFIRMED"]
          },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      });
      
      if (conflictingAppointment) {
        return { success: false, error: 'Time slot conflicts with existing appointment' };
      }
    }
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        dentist: true,
        treatments: true,
      }
    });
    
    return { success: true, data: appointment };
  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update appointment' };
  }
}

export async function deleteAppointment(id: string) {
  try {
    await prisma.appointment.delete({
      where: { id }
    });
    
    return { success: true, message: 'Appointment deleted successfully' };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return { success: false, error: 'Failed to delete appointment' };
  }
}

export async function getAppointmentsByPatient(patientId: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        dentist: true,
        treatments: true,
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Error fetching appointments by patient:', error);
    return { success: false, error: 'Failed to fetch patient appointments' };
  }
}

export async function getAppointmentsByDentist(dentistId: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { dentistId },
      include: {
        patient: true,
        treatments: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Error fetching appointments by dentist:', error);
    return { success: false, error: 'Failed to fetch dentist appointments' };
  }
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
        dentist: true,
        treatments: true,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Error fetching appointments by date range:', error);
    return { success: false, error: 'Failed to fetch appointments for date range' };
  }
}

export async function updateAppointmentStatus(id: string, status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        dentist: true,
      }
    });
    
    return { success: true, data: appointment };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: 'Failed to update appointment status' };
  }
}



export async function getAllDentists() {
  try {
    const dentists = await prisma.staff.findMany({
      where: {
        role: "DENTIST",
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" }
      ]
    });

    return { success: true, data: dentists };
  } catch (error) {
    console.error("Error fetching dentists:", error);
    return { success: false, error: "Failed to fetch dentists" };
  }
}