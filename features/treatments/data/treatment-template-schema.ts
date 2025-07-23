import { z } from 'zod'

export const treatmentTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TreatmentTemplate = z.infer<typeof treatmentTemplateSchema>

export const treatmentTemplateListSchema = z.array(treatmentTemplateSchema)

export const treatmentTemplateCreateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  price: z.number().optional(),
  durationMinutes: z.number().optional(),
})


