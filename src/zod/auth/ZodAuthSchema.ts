import { z } from "zod";

export const ZodLoginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const ZodRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const ZodChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const ZodChangePasswordFormSchema = ZodChangePasswordSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export interface ILoginForm extends z.infer<typeof ZodLoginSchema> {}
export interface IRegisterForm extends z.infer<typeof ZodRegisterSchema> {}
export interface IChangePasswordForm extends z.infer<
  typeof ZodChangePasswordSchema
> {}
export interface IChangePasswordFullForm extends z.infer<
  typeof ZodChangePasswordFormSchema
> {}
