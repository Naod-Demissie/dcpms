import { z } from "zod";

export const invoiceSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  amount: z.number(),
  paidAmount: z.number().optional(), // Added for partial/full payment
  date: z.coerce.date(),
  description: z.string().optional(),
  status: z.enum(["paid", "pending", "cancelled"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export const invoiceListSchema = z.array(invoiceSchema);


