import { z } from "zod";

// Staff role enum
export const staffRoleSchema = z.enum(["ADMIN", "DENTIST", "RECEPTIONIST"]);

// Staff schema
export const staffSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  role: staffRoleSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const staffListSchema = z.array(staffSchema);

export type Staff = z.infer<typeof staffSchema>;
export type StaffRole = z.infer<typeof staffRoleSchema>;

