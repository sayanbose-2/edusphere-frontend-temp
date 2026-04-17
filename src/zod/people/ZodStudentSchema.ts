import { z } from "zod";

export const ZodStudentCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const ZodStudentEditSchema = z.object({
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(1, "Address is required"),
});

export interface IStudentCreateForm extends z.infer<
  typeof ZodStudentCreateSchema
> {}
export interface IStudentEditForm extends z.infer<
  typeof ZodStudentEditSchema
> {}
