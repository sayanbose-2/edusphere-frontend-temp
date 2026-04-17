import { z } from "zod";

const ZodGradeBaseSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  studentId: z.string().min(1, "Student is required"),
  score: z
    .number()
    .min(0, "Score cannot be negative")
    .max(100, "Score cannot exceed 100"),
  grade: z.string().min(1, "Grade is required"),
});

export const ZodGradeSchema = ZodGradeBaseSchema;
export const ZodGradeFormSchema = ZodGradeBaseSchema.extend({
  gradeStatus: z.string(),
});

export interface IGradeForm extends z.infer<typeof ZodGradeFormSchema> {}
