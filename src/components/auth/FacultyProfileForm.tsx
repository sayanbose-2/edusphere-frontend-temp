import { toast } from "react-toastify";
import { BsMortarboardFill } from "react-icons/bs";
import apiClient from "@/api/client";
import { useForm } from "react-hook-form";

interface Props {
  name: string;
  onDone: () => void;
  onSignOut: () => void;
}

interface TForm {
  position: string;
}

const FacultyProfileForm = ({ name, onDone, onSignOut }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<TForm>({
    defaultValues: { position: "" },
  });

  const onSubmit = async (data: TForm) => {
    try {
      await apiClient.post("/faculties/me", {
        position: data.position.trim() || undefined,
      });
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
            <BsMortarboardFill size={22} className="text-blue" />
          </div>
          <h5 className="text-base text-base font-bold mb-1">
            Complete Your Faculty Profile
          </h5>
          <p className="text-xs text-secondary m-0">
            Welcome, {name}! Your administrator will assign your department. You
            can optionally enter your position title below.
          </p>
        </div>

        <div className="bg-subtle border border-light rounded-lg px-3.5 py-3 mb-5 text-sm">
          <div className="text-xs text-tertiary font-semibold uppercase tracking-wider mb-2">
            Your account details
          </div>
          <div className="text-base font-medium">{name}</div>
        </div>

        <div className="rounded-lg p-3.5 mb-5 text-sm border border-yellow-200/40 bg-yellow-400/[0.07] text-secondary">
          Your department will be assigned by your administrator. You can update
          your position title at any time from your profile.
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <label className="form-label">
              Position / Title{" "}
              <span className="text-xs text-tertiary">(optional)</span>
            </label>
            <input
              className="form-control"
              {...register("position")}
              placeholder="e.g. Associate Professor"
            />
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

export default FacultyProfileForm;
