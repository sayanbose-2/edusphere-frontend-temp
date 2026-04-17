import { z } from "zod";

const ZodResearchBaseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title too long"),
  facultyId: z.string().min(1, "Faculty lead is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const ZodResearchSchema = ZodResearchBaseSchema;
export const ZodResearchFormSchema = ZodResearchBaseSchema.extend({
  status: z.string(),
});

export interface IResearchForm extends z.infer<typeof ZodResearchFormSchema> {}
