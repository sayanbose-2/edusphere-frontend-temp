import { z } from "zod";

const ZodCurriculumBaseSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(1000, "Description too long"),
});

export const ZodCurriculumSchema = ZodCurriculumBaseSchema;
export const ZodCurriculumFormSchema = ZodCurriculumBaseSchema.extend({
  status: z.string(),
});

export interface ICurriculumForm extends z.infer<
  typeof ZodCurriculumFormSchema
> {}
