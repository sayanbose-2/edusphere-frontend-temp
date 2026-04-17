import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ZodChangePasswordFormSchema,
  type IChangePasswordFullForm,
} from "@/zod/auth/ZodAuthSchema";

type TForm = IChangePasswordFullForm;

const ChangePasswordPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TForm>({
    resolver: zodResolver(ZodChangePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: TForm) => {
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to change password";
      toast.error(msg);
    }
  };

  return (
    <>
      <PageHeader
        title="Change Password"
        subtitle="Update your account password"
      />
      <div className="bg-surface border border-border rounded-lg p-7 max-w-md shadow-var-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-danger mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              {...register("newPassword")}
              placeholder="Min. 8 characters"
            />
            {errors.newPassword && (
              <p className="text-xs text-danger mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="mb-6">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary font-semibold py-2 px-5"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ChangePasswordPage;
