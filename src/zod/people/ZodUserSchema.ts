import { z } from "zod";

export const ZodUserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
});

export const ZodUserEditSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name too long"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  status: z.string().min(1, "Status is required"),
});

export interface IUserCreateForm extends z.infer<typeof ZodUserCreateSchema> {}
export interface IUserEditForm extends z.infer<typeof ZodUserEditSchema> {}
