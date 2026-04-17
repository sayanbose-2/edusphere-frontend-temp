import { z } from "zod";

export const ZodNotificationSchema = z.object({
  message: z.string().min(1, "Message is required"),
  category: z.string().min(1, "Category is required"),
});

export const ZodNotificationUserSchema = ZodNotificationSchema.extend({
  userId: z.string().min(1, "User is required"),
});

export const ZodNotificationRoleSchema = ZodNotificationSchema.extend({
  role: z.string().min(1, "Role is required"),
});

export const ZodNotificationFormSchema = ZodNotificationSchema.extend({
  userId: z.string().optional(),
  role: z.string().optional(),
});

export interface INotificationForm extends z.infer<
  typeof ZodNotificationFormSchema
> {}
export interface INotificationUserForm extends z.infer<
  typeof ZodNotificationUserSchema
> {}
export interface INotificationRoleForm extends z.infer<
  typeof ZodNotificationRoleSchema
> {}
