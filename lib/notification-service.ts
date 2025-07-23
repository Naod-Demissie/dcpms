"use client";

import { toast } from 'sonner';

export interface NotificationData {
  type: 'invoice' | 'prescription' | 'appointment' | 'treatment';
  patientName: string;
  patientId: string;
  message: string;
  actionRequired?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: NotificationData) => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  subscribe(listener: (notification: NotificationData) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(notification: NotificationData) {
    this.listeners.forEach(listener => listener(notification));
    
    // Show toast notification
    toast.info(notification.message, {
      description: `Patient: ${notification.patientName}`,
      action: notification.actionRequired ? {
        label: 'View',
        onClick: () => this.handleNotificationAction(notification)
      } : undefined
    });
  }

  private handleNotificationAction(notification: NotificationData) {
    switch (notification.type) {
      case 'invoice':
        window.location.href = '/invoices';
        break;
      case 'prescription':
        window.location.href = '/prescriptions';
        break;
      case 'appointment':
        window.location.href = '/appointments';
        break;
      case 'treatment':
        window.location.href = '/treatments';
        break;
    }
  }

  // Specific notification methods
  notifyTreatmentCompleted(patientName: string, patientId: string, treatmentName: string) {
    this.notify({
      type: 'treatment',
      patientName,
      patientId,
      message: `Treatment "${treatmentName}" completed successfully`,
      actionRequired: true
    });

    // Auto-generate invoice and prescription notifications
    setTimeout(() => {
      this.notifyInvoiceGenerated(patientName, patientId);
    }, 2000);

    setTimeout(() => {
      this.notifyPrescriptionGenerated(patientName, patientId);
    }, 3000);
  }

  notifyInvoiceGenerated(patientName: string, patientId: string) {
    this.notify({
      type: 'invoice',
      patientName,
      patientId,
      message: 'Invoice generated and ready for printing',
      actionRequired: true
    });
  }

  notifyPrescriptionGenerated(patientName: string, patientId: string) {
    this.notify({
      type: 'prescription',
      patientName,
      patientId,
      message: 'Prescription generated and ready for printing',
      actionRequired: true
    });
  }

  notifyAppointmentReminder(patientName: string, patientId: string, appointmentTime: string) {
    this.notify({
      type: 'appointment',
      patientName,
      patientId,
      message: `Appointment scheduled for ${appointmentTime}`,
      actionRequired: true
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

