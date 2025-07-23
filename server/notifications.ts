"use server";

import { prisma } from "@/lib/prisma"; 
import { z } from 'zod';

 

// Notification schema for validation
const notificationSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipientType: z.enum(["PATIENT", "STAFF"]),
  message: z.string().min(1, "Message is required"),
  channels: z.enum(["EMAIL", "SMS", "PUSH"]),
  sentAt: z.date(),
});

const notificationCreateSchema = notificationSchema.omit({
  id: true,
  sentAt: true,
});

const notificationUpdateSchema = notificationCreateSchema.partial();

export async function getNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        sentAt: 'desc'
      }
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function getNotificationById(id: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }
    
    return { success: true, data: notification };
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    return { success: false, error: 'Failed to fetch notification' };
  }
}

export async function createNotification(data: z.infer<typeof notificationCreateSchema>) {
  try {
    const validatedData = notificationCreateSchema.parse(data);
    
    // Verify recipient exists
    if (validatedData.recipientType === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { id: validatedData.recipientId }
      });
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }
    } else if (validatedData.recipientType === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { id: validatedData.recipientId }
      });
      if (!staff) {
        return { success: false, error: 'Staff member not found' };
      }
    }
    
    const notification = await prisma.notification.create({
      data: {
        ...validatedData,
        sentAt: new Date()
      }
    });
    
    return { success: true, data: notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function updateNotification(id: string, data: z.infer<typeof notificationUpdateSchema>) {
  try {
    const validatedData = notificationUpdateSchema.parse(data);
    
    const notification = await prisma.notification.update({
      where: { id },
      data: validatedData
    });
    
    return { success: true, data: notification };
  } catch (error) {
    console.error('Error updating notification:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data provided', details: error.errors };
    }
    return { success: false, error: 'Failed to update notification' };
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id }
    });
    
    return { success: true, message: 'Notification deleted successfully' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

export async function getNotificationsByRecipient(recipientId: string, recipientType: "PATIENT" | "STAFF") {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId,
        recipientType
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications by recipient:', error);
    return { success: false, error: 'Failed to fetch recipient notifications' };
  }
}

export async function getNotificationsByChannel(channel: "EMAIL" | "SMS" | "PUSH") {
  try {
    const notifications = await prisma.notification.findMany({
      where: { channels: channel },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications by channel:', error);
    return { success: false, error: 'Failed to fetch notifications by channel' };
  }
}

export async function getNotificationsByDateRange(startDate: Date, endDate: Date) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        sentAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications by date range:', error);
    return { success: false, error: 'Failed to fetch notifications for date range' };
  }
}

export async function sendAppointmentReminder(appointmentId: string, channel: "EMAIL" | "SMS" | "PUSH" = "EMAIL") {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        dentist: true
      }
    });
    
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const message = `Reminder: You have an appointment scheduled for ${appointment.startTime.toLocaleDateString()} at ${appointment.startTime.toLocaleTimeString()}${appointment.dentist ? ` with Dr. ${appointment.dentist.firstName} ${appointment.dentist.lastName}` : ''}.`;
    
    const notification = await createNotification({
      recipientId: appointment.patientId,
      recipientType: "PATIENT",
      message,
      channels: channel
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return { success: false, error: 'Failed to send appointment reminder' };
  }
}

export async function sendPaymentReminder(invoiceId: string, channel: "EMAIL" | "SMS" | "PUSH" = "EMAIL") {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        payments: true
      }
    });
    
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }
    
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = invoice.totalAmount - totalPaid;
    
    if (remainingAmount <= 0) {
      return { success: false, error: 'Invoice is already fully paid' };
    }
    
    const message = `Payment reminder: You have an outstanding balance of $${remainingAmount.toFixed(2)} for invoice #${invoice.id.substring(0, 8)}. Please contact us to arrange payment.`;
    
    const notification = await createNotification({
      recipientId: invoice.patientId,
      recipientType: "PATIENT",
      message,
      channels: channel
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error: 'Failed to send payment reminder' };
  }
}

export async function sendTreatmentUpdate(treatmentId: string, message: string, channel: "EMAIL" | "SMS" | "PUSH" = "EMAIL") {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: {
        patient: true
      }
    });
    
    if (!treatment) {
      return { success: false, error: 'Treatment not found' };
    }
    
    const notification = await createNotification({
      recipientId: treatment.patientId,
      recipientType: "PATIENT",
      message,
      channels: channel
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending treatment update:', error);
    return { success: false, error: 'Failed to send treatment update' };
  }
}

export async function sendStaffNotification(staffId: string, message: string, channel: "EMAIL" | "SMS" | "PUSH" = "EMAIL") {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });
    
    if (!staff) {
      return { success: false, error: 'Staff member not found' };
    }
    
    const notification = await createNotification({
      recipientId: staffId,
      recipientType: "STAFF",
      message,
      channels: channel
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending staff notification:', error);
    return { success: false, error: 'Failed to send staff notification' };
  }
}

export async function bulkSendNotifications(notifications: Array<{recipientId: string, recipientType: "PATIENT" | "STAFF", message: string, channels: "EMAIL" | "SMS" | "PUSH"}>) {
  try {
    const results = [];
    
    for (const notificationData of notifications) {
      const result = await createNotification(notificationData);
      results.push(result);
    }
    
    return { success: true, data: results };
  } catch (error) {
    console.error('Error bulk sending notifications:', error);
    return { success: false, error: 'Failed to bulk send notifications' };
  }
}

