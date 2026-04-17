import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import { NotificationType, Role } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { IUser, IPageResponse } from "@/types/academicTypes";
import {
  ZodNotificationFormSchema,
  type INotificationForm,
} from "@/zod/admin/ZodNotificationSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type TTarget = "all" | "user" | "role";

type TForm = INotificationForm;

const NotificationPage = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [target, setTarget] = useState<TTarget>("all");
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TForm>({
    resolver: zodResolver(ZodNotificationFormSchema),
    defaultValues: {
      message: "",
      category: NotificationType.ENROLLMENT,
      userId: "",
      role: Role.STUDENT,
    },
  });

  useEffect(() => {
    apiClient
      .get<IPageResponse<IUser> | IUser[]>("/users")
      .then((r) => {
        const d = r.data;
        setUsers(Array.isArray(d) ? d : (d.content ?? []));
      })
      .catch((err: unknown) => {
        const st = (err as { response?: { status?: number } })?.response
          ?.status;
        if (st !== 404 && st !== 500) toast.error("Failed to load users");
      });
  }, []);

  const handleTargetChange = (val: TTarget) => {
    setTarget(val);
    reset({
      message: "",
      category: NotificationType.ENROLLMENT,
      userId: "",
      role: Role.STUDENT,
    });
  };

  const onSubmit = async (data: TForm) => {
    setSending(true);
    try {
      if (target === "user") {
        await apiClient.post(`/notifications/send/user/${data.userId}`, {
          userId: data.userId,
          entityId: data.userId,
          message: data.message,
          category: data.category,
          isRead: false,
        });
        toast.success("Notification sent to user");
      } else if (target === "role") {
        await apiClient.post(`/notifications/send/role/${data.role}`, {
          message: data.message,
          category: data.category,
        });
        toast.success(`Sent to all ${formatEnum(data.role!)}s`);
      } else {
        await apiClient.post("/notifications/send/all", {
          message: data.message,
          category: data.category,
        });
        toast.success("Broadcast sent to all users");
      }
      reset({
        message: "",
        category: NotificationType.ENROLLMENT,
        userId: "",
        role: Role.STUDENT,
      });
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const tgtBtn = (val: TTarget, label: string) => (
    <button
      key={val}
      type="button"
      onClick={() => handleTargetChange(val)}
      className={`px-4 py-1.5 rounded text-sm font-semibold cursor-pointer border transition-colors ${
        target === val
          ? "bg-blue-dim border-blue text-blue"
          : "bg-transparent border-border text-secondary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Send Notifications"
        subtitle="Broadcast messages to users, roles, or everyone"
      />
      <div className="bg-surface border border-border rounded-lg p-7 max-w-xl shadow-var-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label className="form-label">Target audience</label>
            <div className="flex gap-2">
              {tgtBtn("all", "Broadcast All")}
              {tgtBtn("user", "Specific User")}
              {tgtBtn("role", "By Role")}
            </div>
          </div>

          {target === "user" && (
            <div className="mb-4">
              <label className="form-label">Select User</label>
              <select className="form-select" {...register("userId")}>
                <option value="">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="text-xs text-danger mt-1">
                  {(errors.userId as { message?: string }).message}
                </p>
              )}
            </div>
          )}

          {target === "role" && (
            <div className="mb-4">
              <label className="form-label">Select Role</label>
              <select className="form-select" {...register("role")}>
                {Object.values(Role).map((r) => (
                  <option key={r} value={r}>
                    {formatEnum(r)}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-danger mt-1">
                  {(errors.role as { message?: string }).message}
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="form-label">Category</label>
            <select className="form-select" {...register("category")}>
              {Object.values(NotificationType).map((t) => (
                <option key={t} value={t}>
                  {formatEnum(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="form-label">Message</label>
            <textarea
              className="form-control"
              rows={5}
              {...register("message")}
              placeholder="Enter notification message…"
            />
            {errors.message && (
              <p className="text-xs text-danger mt-1">
                {errors.message.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary font-semibold py-2 px-6"
            disabled={sending}
          >
            {sending && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {sending ? "Sending…" : "Send Notification"}
          </button>
        </form>
      </div>
    </>
  );
};

export default NotificationPage;
