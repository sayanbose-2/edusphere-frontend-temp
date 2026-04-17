import { z } from "zod";

export const ZodCourseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  departmentId: z.string().min(1, "Department is required"),
  credits: z.number().min(1, "Credits must be at least 1"),
  duration: z.number().min(1, "Duration must be at least 1"),
});

export interface ICourseForm extends z.infer<typeof ZodCourseSchema> {}
