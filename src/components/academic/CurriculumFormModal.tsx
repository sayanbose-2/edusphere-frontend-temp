import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModuleEditor } from "@/components/curriculum/ModuleEditor";
import { Status } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodCurriculumFormSchema,
  type ICurriculumForm,
} from "@/zod/academic/ZodCurriculumSchema";
import type { ICourse, ICurriculum } from "@/types/academicTypes";

interface IModuleEntry {
  title: string;
  description: string;
  topics: string;
}

const emptyMod = (): IModuleEntry => ({
  title: "",
  description: "",
  topics: "",
});

export const parseMods = (json: unknown): IModuleEntry[] => {
  try {
    const p = typeof json === "string" ? JSON.parse(json) : json;
    if (!Array.isArray(p) || !p.length) return [emptyMod()];
    return p.map((m: Record<string, unknown>) => ({
      title: String(m.title || ""),
      description: String(m.description || ""),
      topics: Array.isArray(m.topics)
        ? (m.topics as string[]).join(", ")
        : String(m.topics || ""),
    }));
  } catch {
    return [emptyMod()];
  }
};

export const serializeMods = (mods: IModuleEntry[]) =>
  JSON.stringify(
    mods
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title.trim(),
        description: m.description.trim(),
        topics: m.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })),
  );

export type TCurriculumForm = ICurriculumForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: ICurriculum | null;
  courses: ICourse[];
  saving: boolean;
  onSave: (data: TCurriculumForm, modulesJSON: string) => void;
}

export const CurriculumFormModal = ({
  show,
  onHide,
  selected,
  courses,
  saving,
  onSave,
}: Props) => {
  const [modules, setModules] = useState<IModuleEntry[]>([emptyMod()]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TCurriculumForm>({
    resolver: zodResolver(ZodCurriculumFormSchema),
    defaultValues: { courseId: "", description: "", status: Status.ACTIVE },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        courseId: selected.courseId,
        description: selected.description,
        status: selected.status,
      });
      setModules(parseMods(selected.modulesJSON));
    } else {
      reset({ courseId: "", description: "", status: Status.ACTIVE });
      setModules([emptyMod()]);
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {selected ? "Edit Curriculum" : "New Curriculum"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="form-label">Course</label>
            <select className="form-select" {...register("courseId")}>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-xs text-danger mt-1">
                {errors.courseId.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register("status")}>
              {Object.values(Status).map((s) => (
                <option key={s} value={s}>
                  {formatEnum(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4.5">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={3}
            {...register("description")}
            placeholder="Overall curriculum description"
          />
          {errors.description && (
            <p className="text-xs text-danger mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
        <ModuleEditor modules={modules} onChange={setModules} />
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit((data) => onSave(data, serializeMods(modules)))}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
