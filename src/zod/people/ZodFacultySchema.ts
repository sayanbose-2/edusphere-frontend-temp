import { z } from "zod";

export const ZodFacultyCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  departmentId: z.string().min(1, "Department is required"),
});

export const ZodFacultyEditSchema = z.object({
  position: z.string().min(1, "Position is required"),
  departmentId: z.string().min(1, "Department is required"),
  status: z.string().min(1, "Status is required"),
});

export interface IFacultyCreateForm extends z.infer<
  typeof ZodFacultyCreateSchema
> {}
export interface IFacultyEditForm extends z.infer<
  typeof ZodFacultyEditSchema
> {}
