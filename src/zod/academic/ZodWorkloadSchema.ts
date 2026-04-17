import { z } from "zod";

const ZodWorkloadBaseSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required"),
  courseId: z.string().min(1, "Course is required"),
  semester: z.string().min(1, "Semester is required"),
  hours: z.number().min(0, "Hours cannot be negative"),
});

export const ZodWorkloadSchema = ZodWorkloadBaseSchema;
export const ZodWorkloadFormSchema = ZodWorkloadBaseSchema.extend({
  status: z.string(),
});

export interface IWorkloadForm extends z.infer<typeof ZodWorkloadFormSchema> {}
