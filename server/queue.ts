"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Queue schema for validation
const queueSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  assignedStaff: z.string().optional().nullable(),
  status: z.enum(["WAITING", "IN_TREATMENT", "COMPLETED", "NO_SHOW"]).default("WAITING"),
  appointmentId: z.string().uuid().optional().nullable(),
  checkInTime: z.date().optional().nullable(),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.date(),  
  updatedAt: z.date(),
});

const queueCreateSchema = queueSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const queueUpdateSchema = queueCreateSchema.partial();

export async function getQueue() {
  try {
    const queue = await prisma.queue.findMany({
      include: {
        patient: true,
        staff: true,
      },
      orderBy: [
        { status: 'asc' },
        { checkInTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    return { success: true, data: queue };
  } catch (error) {
    console.error('Error fetching queue:', error);
    return { success: false, error: 'Failed to fetch queue' };
  }
}

export async function getQueueEntryById(id: string) {
  try {
    const queueEntry = await prisma.queue.findUnique({
      where: { id },
      include: {
        patient: true,
        staff: true,
      }
    });
    
    if (!queueEntry) {
      return { success: false, error: 'Queue entry not found' };
    }
    
    return { success: true, data: queueEntry };
  } catch (error) {
    console.error('Error fetching queue entry by ID:', error);
    return { success: false, error: 'Failed to fetch queue entry' };
  }
}

export async function addToQueue(data: z.infer<typeof queueCreateSchema>) {
  try {
    const validatedData = queueCreateSchema.parse(data);
    
    // Check if patient is already in queue
    const existingEntry = await prisma.queue.findFirst({
      where: {
        patientId: validatedData.patientId,
        status: {
          in: ["WAITING", "IN_TREATMENT"]
        }
      }
    });
    
    if (existingEntry) {
      return { success: false, error: 'Patient is already in queue' };
    }
    
    const queueEntry = await prisma.queue.create({
      data: {
        ...validatedData,
        checkInTime: validatedData.checkInTime || new Date()
      },
      include: {
        patient: true,
        staff: true,
      }
    });
    
    return { success: true, data: queueEntry };
  } catch (error) {
    console.error('Error adding to queue:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to add to queue' };
  }
}

export async function updateQueueEntry(id: string, data: z.infer<typeof queueUpdateSchema>) {
  try {
    const validatedData = queueUpdateSchema.parse(data);
    
    const queueEntry = await prisma.queue.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        staff: true,
      }
    });
    
    return { success: true, data: queueEntry };
  } catch (error) {
    console.error('Error updating queue entry:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update queue entry' };
  }
}

export async function removeFromQueue(id: string) {
  try {
    await prisma.queue.delete({
      where: { id }
    });
    
    return { success: true, message: 'Queue entry removed successfully' };
  } catch (error) {
    console.error('Error removing from queue:', error);
    return { success: false, error: 'Failed to remove from queue' };
  }
}

export async function updateQueueStatus(id: string, status: "WAITING" | "IN_TREATMENT" | "COMPLETED" | "NO_SHOW") {
  try {
    const updateData: any = { status };
    
    // Set timestamps based on status
    if (status === "IN_TREATMENT") {
      updateData.startedAt = new Date();
    } else if (status === "COMPLETED" || status === "NO_SHOW") {
      updateData.completedAt = new Date();
    }
    
    const queueEntry = await prisma.queue.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        staff: true,
      }
    });
    
    return { success: true, data: queueEntry };
  } catch (error) {
    console.error('Error updating queue status:', error);
    return { success: false, error: 'Failed to update queue status' };
  }
}

export async function assignStaffToQueue(id: string, staffId: string) {
  try {
    const queueEntry = await prisma.queue.update({
      where: { id },
      data: { assignedStaff: staffId },
      include: {
        patient: true,
        staff: true,
      }
    });
    
    return { success: true, data: queueEntry };
  } catch (error) {
    console.error('Error assigning staff to queue:', error);
    return { success: false, error: 'Failed to assign staff to queue' };
  }
}

export async function getQueueByStatus(status: "WAITING" | "IN_TREATMENT" | "COMPLETED" | "NO_SHOW") {
  try {
    const queue = await prisma.queue.findMany({
      where: { status },
      include: {
        patient: true,
        staff: true,
      },
      orderBy: [
        { checkInTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    return { success: true, data: queue };
  } catch (error) {
    console.error('Error fetching queue by status:', error);
    return { success: false, error: 'Failed to fetch queue by status' };
  }
}

export async function getQueueByStaff(staffId: string) {
  try {
    const queue = await prisma.queue.findMany({
      where: { assignedStaff: staffId },
      include: {
        patient: true,
        staff: true,
      },
      orderBy: [
        { status: 'asc' },
        { checkInTime: 'asc' }
      ]
    });
    
    return { success: true, data: queue };
  } catch (error) {
    console.error('Error fetching queue by staff:', error);
    return { success: false, error: 'Failed to fetch queue by staff' };
  }
}

export async function getQueueByPatient(patientId: string) {
  try {
    const queue = await prisma.queue.findMany({
      where: { patientId },
      include: {
        staff: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { success: true, data: queue };
  } catch (error) {
    console.error('Error fetching queue by patient:', error);
    return { success: false, error: 'Failed to fetch queue by patient' };
  }
}

export async function getActiveQueue() {
  try {
    const queue = await prisma.queue.findMany({
      where: {
        status: {
          in: ["WAITING", "IN_TREATMENT"]
        }
      },
      include: {
        patient: true,
        staff: true,
      },
      orderBy: [
        { status: 'asc' },
        { checkInTime: 'asc' }
      ]
    });
    
    return { success: true, data: queue };
  } catch (error) {
    console.error('Error fetching active queue:', error);
    return { success: false, error: 'Failed to fetch active queue' };
  }
}

// Helper to get start and end of week (Monday-Sunday)
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export async function getWeeklyPatientVisitsBarChart({ start, end }: { start?: Date, end?: Date } = {}) {
  let range = getWeekRange();
  if (start && end) {
    range = { start, end };
  }
  const queueEntries = await prisma.queue.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: range.start,
        lte: range.end,
      },
    },
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = Array(7).fill(0);
  queueEntries.forEach(entry => {
    if (!entry.completedAt) return;
    const d = new Date(entry.completedAt);
    const dayIdx = (d.getDay() + 6) % 7; // Monday=0, Sunday=6
    counts[dayIdx]++;
  });
  return days.map((name, i) => ({ name, appointments: counts[i] }));
}

