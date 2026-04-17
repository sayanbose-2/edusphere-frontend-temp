import { z } from "zod";

const ZodDepartmentBaseSchema = z.object({
  departmentName: z.string().min(1, "Department name is required"),
  departmentCode: z.string().min(1, "Department code is required"),
  contactInfo: z.string().min(1, "Contact info is required"),
});

export const ZodDepartmentSchema = ZodDepartmentBaseSchema;
export const ZodDepartmentFormSchema = ZodDepartmentBaseSchema.extend({
  status: z.string(),
});

export interface IDepartmentForm extends z.infer<
  typeof ZodDepartmentFormSchema
> {}
