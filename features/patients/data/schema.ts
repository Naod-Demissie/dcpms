import { z } from 'zod'

const bloodTypeSchema = z.union([
  z.literal("A_POSITIVE"),
  z.literal("A_NEGATIVE"),
  z.literal("B_POSITIVE"),
  z.literal("B_NEGATIVE"),
  z.literal("AB_POSITIVE"),
  z.literal("AB_NEGATIVE"),
  z.literal("O_POSITIVE"),
  z.literal("O_NEGATIVE"),
])

const genderSchema = z.union([
  z.literal("Male"),
  z.literal("Female"),
])

export const patientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: genderSchema,
  dateOfBirth: z.coerce.date(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  bloodType: bloodTypeSchema.optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).transform((patient) => ({
  ...patient,
  fullName: `${patient.firstName} ${patient.lastName}`,
}));

export type Patient = z.infer<typeof patientSchema>
export const patientListSchema = z.array(patientSchema)


