import { z } from "zod";

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  dentistId: z.string().uuid().optional().nullable(),
  receptionistId: z.string().uuid().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).default("SCHEDULED"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
export const appointmentListSchema = z.array(appointmentSchema);


