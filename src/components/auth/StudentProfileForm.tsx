import { Gender } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import { toast } from "react-toastify";
import { BsPersonCheck } from "react-icons/bs";
import apiClient from "@/api/client";
import { DateInput, today } from "@/components/common/DateInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ZodStudentEditSchema,
  type IStudentEditForm,
} from "@/zod/people/ZodStudentSchema";

type TForm = IStudentEditForm;

interface Props {
  name: string;
  onDone: () => void;
  onSignOut: () => void;
}

const StudentProfileForm = ({ name, onDone, onSignOut }: Props) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TForm>({
    resolver: zodResolver(ZodStudentEditSchema),
    defaultValues: { dob: "", gender: "", address: "" },
  });

  const onSubmit = async (data: TForm) => {
    try {
      await apiClient.post("/students/me", data);
      toast.success("Profile created! Welcome to EduSphere.");
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="auth-box max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-dim flex items-center justify-center mx-auto mb-3.5">
            <BsPersonCheck size={22} className="text-blue" />
          </div>
          <h5 className="text-base text-base font-bold mb-1">
            Complete Your Profile
          </h5>
          <p className="text-xs text-secondary m-0">
            Welcome, {name}! Please fill in a few personal details to get
            started.
          </p>
        </div>

        <div className="bg-subtle border border-light rounded-lg px-3.5 py-3 mb-5 text-sm">
          <div className="text-xs text-tertiary font-semibold uppercase tracking-wider mb-2">
            Your account details
          </div>
          <div className="text-base font-medium">{name}</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">
                Date of Birth <span className="text-danger">*</span>
              </label>
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    max={today}
                  />
                )}
              />
              {errors.dob && (
                <p className="text-xs text-danger mt-1">{errors.dob.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">
                Gender <span className="text-danger">*</span>
              </label>
              <select className="form-select" {...register("gender")}>
                <option value="">Select gender</option>
                {Object.values(Gender).map((g) => (
                  <option key={g} value={g}>
                    {formatEnum(g)}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="text-xs text-danger mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label className="form-label">
              Address <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              {...register("address")}
              placeholder="Your full address"
            />
            {errors.address && (
              <p className="text-xs text-danger mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mb-2.5 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            Save & Go to Dashboard
          </button>
        </form>
        <button
          className="btn btn-outline-secondary w-full text-xs"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default StudentProfileForm;
