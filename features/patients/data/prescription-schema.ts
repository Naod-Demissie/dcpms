import { z } from "zod";

export const prescriptionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  medication: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Prescription = z.infer<typeof prescriptionSchema>;
export const prescriptionListSchema = z.array(prescriptionSchema);


