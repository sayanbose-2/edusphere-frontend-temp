import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MetricsEditor } from "@/components/report/MetricsEditor";
import { Status, ReportScope } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodReportFormSchema,
  type IReportForm,
} from "@/zod/report/ZodReportSchema";
import type { IReport } from "@/types/complianceTypes";
import type { IDepartment } from "@/types/academicTypes";

interface IMetricRow {
  key: string;
  value: string;
}

const parseMetrics = (json: string): IMetricRow[] => {
  try {
    const o = JSON.parse(json);
    if (o && typeof o === "object")
      return Object.entries(o).map(([k, v]) => ({ key: k, value: String(v) }));
  } catch {
    /* invalid json */
  }
  return [{ key: "", value: "" }];
};

export const serializeMetrics = (rows: IMetricRow[]) =>
  JSON.stringify(
    Object.fromEntries(
      rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]),
    ),
  );

export type TReportForm = IReportForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IReport | null;
  departments: IDepartment[];
  saving: boolean;
  onSave: (data: TReportForm, metrics: string) => void;
}

export const ReportFormModal = ({
  show,
  onHide,
  selected,
  departments,
  saving,
  onSave,
}: Props) => {
  const [metricRows, setMetricRows] = useState<IMetricRow[]>([
    { key: "", value: "" },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TReportForm>({
    resolver: zodResolver(ZodReportFormSchema),
    defaultValues: {
      scope: ReportScope.DEPARTMENT,
      departmentId: "",
      status: Status.ACTIVE,
    },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        departmentId: String(selected.department || ""),
        scope: selected.scope,
        status: selected.status,
      });
      setMetricRows(parseMetrics(selected.metrics));
    } else {
      reset({
        scope: ReportScope.DEPARTMENT,
        departmentId: "",
        status: Status.ACTIVE,
      });
      setMetricRows([{ key: "", value: "" }]);
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{selected ? "Edit Report" : "New Report"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="grid grid-cols-2 gap-3.5 mb-5">
          <div>
            <label className="form-label">Scope</label>
            <select className="form-select" {...register("scope")}>
              {Object.values(ReportScope).map((s) => (
                <option key={s} value={s}>
                  {formatEnum(s)}
                </option>
              ))}
            </select>
            {errors.scope && (
              <p className="text-xs text-danger mt-1">{errors.scope.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-select" {...register("departmentId")}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="text-xs text-danger mt-1">
                {errors.departmentId.message}
              </p>
            )}
          </div>
        </div>
        <MetricsEditor rows={metricRows} onChange={setMetricRows} />
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" {...register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit((data) =>
            onSave(data, serializeMetrics(metricRows)),
          )}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
