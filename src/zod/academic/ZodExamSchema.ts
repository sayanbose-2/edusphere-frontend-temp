import { z } from "zod";

export const ZodExamSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  type: z.string().min(1, "Exam type is required"),
  date: z.string().min(1, "Exam date is required"),
});

export interface IExamForm extends z.infer<typeof ZodExamSchema> {}
