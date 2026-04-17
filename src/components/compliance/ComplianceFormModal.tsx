import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateInput } from "@/components/common/DateInput";
import {
  ComplianceResult,
  ComplianceEntityType,
  ComplianceType,
} from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodComplianceFormSchema,
  type IComplianceForm,
} from "@/zod/compliance/ZodComplianceSchema";
import apiClient from "@/api/client";
import type { IComplianceRecord } from "@/types/complianceTypes";
import type { IPageResponse } from "@/types/academicTypes";

export type TComplianceForm = IComplianceForm;

interface IEntityOption {
  id: string;
  label: string;
}

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IComplianceRecord | null;
  saving: boolean;
  onSave: (data: TComplianceForm) => void;
}

const fetchEntityList = async (type: string): Promise<IEntityOption[]> => {
  try {
    switch (type) {
      case ComplianceEntityType.STUDENT: {
        const d = await apiClient
          .get<IPageResponse<{ id: string; name: string }>>("/students")
          .then((r) => r.data.content ?? []);
        return d.map((s) => ({ id: s.id, label: s.name }));
      }
      case ComplianceEntityType.FACULTY: {
        const d = await apiClient
          .get<IPageResponse<{ id: string; name: string }>>("/faculties")
          .then((r) => r.data.content ?? []);
        return d.map((f) => ({ id: f.id, label: f.name }));
      }
      case ComplianceEntityType.DEPARTMENT: {
        const d = await apiClient
          .get<
            IPageResponse<{ id: string; departmentName: string }>
          >("/departments")
          .then((r) => r.data.content ?? []);
        return d.map((x) => ({ id: x.id, label: x.departmentName }));
      }
      case ComplianceEntityType.COURSE: {
        const d = await apiClient
          .get<IPageResponse<{ id: string; title: string }>>("/courses")
          .then((r) =>
            Array.isArray(r.data) ? r.data : (r.data.content ?? []),
          );
        return d.map((c) => ({ id: c.id, label: c.title }));
      }
      case ComplianceEntityType.CURRICULUM: {
        const d = await apiClient
          .get<
            IPageResponse<{ id: string; description: string }>
          >("/curriculums")
          .then((r) => r.data.content ?? []);
        return d.map((c) => ({ id: c.id, label: c.description }));
      }
      case ComplianceEntityType.EXAM: {
        const d = await apiClient
          .get<
            IPageResponse<{ id: string; type: string; date: string }>
          >("/exams")
          .then((r) => r.data.content ?? []);
        return d.map((e) => ({
          id: e.id,
          label: `${formatEnum(e.type)} — ${e.date}`,
        }));
      }
      case ComplianceEntityType.THESIS: {
        const d = await apiClient
          .get<IPageResponse<{ id: string; title: string }>>("/theses")
          .then((r) => r.data.content ?? []);
        return d.map((t) => ({ id: t.id!, label: t.title }));
      }
      case ComplianceEntityType.RESEARCH_PROJECT: {
        const d = await apiClient
          .get<
            IPageResponse<{ id: string; title: string }>
          >("/research-projects")
          .then((r) => r.data.content ?? []);
        return d.map((r) => ({ id: r.id, label: r.title }));
      }
      case ComplianceEntityType.STUDENT_DOCUMENT: {
        const d = await apiClient
          .get<
            IPageResponse<{
              studentDocumentId: string;
              docType: string;
              studentName?: string;
            }>
          >("/student-documents/all")
          .then((r) => r.data.content ?? []);
        return d.map((x) => ({
          id: x.studentDocumentId,
          label: `${formatEnum(x.docType)}${x.studentName ? " — " + x.studentName : ""}`,
        }));
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
};

export const ComplianceFormModal = ({
  show,
  onHide,
  selected,
  saving,
  onSave,
}: Props) => {
  const [entityList, setEntityList] = useState<IEntityOption[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TComplianceForm>({
    resolver: zodResolver(ZodComplianceFormSchema),
    defaultValues: {
      entityType: ComplianceEntityType.STUDENT,
      entityId: "",
      complianceType: ComplianceType.COURSE,
      result: ComplianceResult.PASS,
      complianceDate: "",
      notes: "",
    },
  });

  const watchedEntityType = watch("entityType");

  const loadEntities = async (type: string) => {
    setEntitiesLoading(true);
    setEntityList([]);
    const list = await fetchEntityList(type);
    setEntityList(list);
    setEntitiesLoading(false);
  };

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        entityType: selected.entityType,
        entityId: selected.entityId,
        complianceType: selected.complianceType,
        result: selected.result,
        complianceDate: selected.complianceDate,
        notes: selected.notes ?? "",
      });
      loadEntities(selected.entityType);
    } else {
      reset({
        entityType: ComplianceEntityType.STUDENT,
        entityId: "",
        complianceType: ComplianceType.COURSE,
        result: ComplianceResult.PASS,
        complianceDate: "",
        notes: "",
      });
      loadEntities(ComplianceEntityType.STUDENT);
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {selected ? "Edit Record" : "Create Compliance Record"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Entity Type</label>
          <select
            className="form-select"
            {...register("entityType", {
              onChange: (e) => {
                setValue("entityId", "");
                loadEntities(e.target.value);
              },
            })}
          >
            {Object.values(ComplianceEntityType).map((t) => (
              <option key={t} value={t}>
                {formatEnum(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3.5">
          <label className="form-label">Entity</label>
          <select
            className="form-select"
            {...register("entityId")}
            disabled={entitiesLoading}
          >
            <option value="">
              {entitiesLoading
                ? "Loading…"
                : `Select ${formatEnum(watchedEntityType)}`}
            </option>
            {entityList.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.entityId && (
            <p className="text-xs text-danger mt-1">
              {errors.entityId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="form-label">Compliance Type</label>
            <select className="form-select" {...register("complianceType")}>
              {Object.values(ComplianceType).map((t) => (
                <option key={t} value={t}>
                  {formatEnum(t)}
                </option>
              ))}
            </select>
            {errors.complianceType && (
              <p className="text-xs text-danger mt-1">
                {errors.complianceType.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Result</label>
            <select className="form-select" {...register("result")}>
              {Object.values(ComplianceResult).map((r) => (
                <option key={r} value={r}>
                  {formatEnum(r)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="form-label">Compliance Date</label>
          <Controller
            control={control}
            name="complianceDate"
            render={({ field }) => (
              <DateInput value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.complianceDate && (
            <p className="text-xs text-danger mt-1">
              {errors.complianceDate.message}
            </p>
          )}
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            rows={3}
            {...register("notes")}
            placeholder="Optional notes…"
          />
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
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
