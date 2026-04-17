import { z } from "zod";

const ZodThesisBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  supervisorId: z.string().min(1, "Supervisor is required"),
  submissionDate: z.string().min(1, "Submission date is required"),
});

export const ZodThesisSchema = ZodThesisBaseSchema;
export const ZodThesisFormSchema = ZodThesisBaseSchema.extend({
  studentId: z.string(),
  status: z.string(),
});

export interface IThesisForm extends z.infer<typeof ZodThesisFormSchema> {}
