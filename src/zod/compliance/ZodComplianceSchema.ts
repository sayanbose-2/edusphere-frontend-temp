import { z } from "zod";

const ZodComplianceBaseSchema = z.object({
  entityId: z.string().min(1, "Entity is required"),
  entityType: z.string().min(1, "Entity type is required"),
  complianceType: z.string().min(1, "Compliance type is required"),
  result: z.string().min(1, "Result is required"),
  complianceDate: z.string().min(1, "Compliance date is required"),
});

export const ZodComplianceRecordSchema = ZodComplianceBaseSchema;
export const ZodComplianceFormSchema = ZodComplianceBaseSchema.extend({
  notes: z.string().optional(),
});

export interface IComplianceForm extends z.infer<
  typeof ZodComplianceFormSchema
> {}
