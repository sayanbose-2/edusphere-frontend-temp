import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { DateInput } from "@/components/common/DateInput";
import { ProjectStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodResearchFormSchema,
  type IResearchForm,
} from "@/zod/research/ZodResearchSchema";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { IFaculty } from "@/types/academicTypes";

type TForm = IResearchForm;

interface Props {
  show: boolean;
  onHide: () => void;
  faculties: IFaculty[];
  onSave: (data: TForm) => Promise<void>;
  saving: boolean;
}

export const ResearchFormModal = ({
  show,
  onHide,
  faculties,
  onSave,
  saving,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<TForm>({
    resolver: zodResolver(ZodResearchFormSchema),
    defaultValues: {
      title: "",
      facultyId: "",
      startDate: "",
      endDate: "",
      status: ProjectStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (show)
      reset({
        title: "",
        facultyId: "",
        startDate: "",
        endDate: "",
        status: ProjectStatus.ACTIVE,
      });
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDate = watch("startDate");

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>New Research Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            {...register("title")}
            placeholder="Project title"
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Faculty Lead</label>
          <select className="form-select" {...register("facultyId")}>
            <option value="">Select faculty lead</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {errors.facultyId && (
            <p className="text-xs text-danger mt-1">
              {errors.facultyId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="form-label">Start Date</label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DateInput value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.startDate && (
              <p className="text-xs text-danger mt-1">
                {errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">End Date</label>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  min={startDate || undefined}
                />
              )}
            />
            {errors.endDate && (
              <p className="text-xs text-danger mt-1">
                {errors.endDate.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" {...register("status")}>
            {Object.values(ProjectStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnum(s)}
              </option>
            ))}
          </select>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit(onSave)}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Create
        </button>
      </Modal.Footer>
    </Modal>
  );
};
