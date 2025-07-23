import { z } from "zod";

export const treatmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  date: z.coerce.date(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Treatment = z.infer<typeof treatmentSchema>;
export const treatmentListSchema = z.array(treatmentSchema);


