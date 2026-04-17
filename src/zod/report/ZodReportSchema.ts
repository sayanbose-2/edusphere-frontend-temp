import { z } from "zod";

const ZodReportBaseSchema = z.object({
  scope: z.string().min(1, "Scope is required"),
  departmentId: z.string().min(1, "Department is required"),
});

export const ZodReportSchema = ZodReportBaseSchema;
export const ZodReportFormSchema = ZodReportBaseSchema.extend({
  status: z.string(),
});

export interface IReportForm extends z.infer<typeof ZodReportFormSchema> {}
