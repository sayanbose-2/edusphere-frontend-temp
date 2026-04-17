import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  ReportFormModal,
  type TReportForm,
} from "@/components/report/ReportFormModal";
import { Role } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { Column } from "@/components/common/DataTable";
import type { IReport } from "@/types/complianceTypes";
import type { IDepartment, IPageResponse } from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const renderMetrics = (json: string) => {
  try {
    const o = JSON.parse(json);
    if (o && typeof o === "object") {
      const entries = Object.entries(o);
      return entries.length ? (
        <div className="flex flex-wrap gap-1">
          {entries.map(([k, v]) => (
            <span
              key={k}
              className="text-xs bg-bg border border-border rounded px-2 py-0.5 text-secondary"
            >
              {k}: <strong className="text-base">{String(v)}</strong>
            </span>
          ))}
        </div>
      ) : (
        <span className="text-tertiary">—</span>
      );
    }
  } catch {
    /* invalid json */
  }
  return <span className="text-tertiary">—</span>;
};

const ReportPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;
  const canEdit = isAdmin;

  const [data, setData] = useState<{
    items: IReport[];
    departments: IDepartment[];
  }>({ items: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IReport | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isDeptHead && !isAdmin) {
        const depts = await apiClient
          .get<
            IPageResponse<IDepartment>
          >("/departments", { params: { size: 100 } })
          .then((r) => r.data.content ?? []);
        const myDept = depts.find((d) => d.headId === user?.id);
        const reports = myDept
          ? await apiClient
              .get<IReport[]>(`/reports/department/${myDept.id}`)
              .then((r) => r.data)
          : [];
        setData({ departments: depts, items: reports });
      } else {
        const [r, d] = await Promise.all([
          apiClient.get<IReport[]>("/reports").then((r) => r.data),
          apiClient
            .get<
              IPageResponse<IDepartment>
            >("/departments", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        setData({ items: r, departments: d });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500)
        toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TReportForm, metrics: string) => {
    if (!metrics || metrics === "{}") {
      toast.error("Add at least one metric");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        generatedBy: user?.id || "",
        departmentId: formData.departmentId,
        scope: formData.scope,
        metrics,
        status: formData.status,
      };
      if (selected) {
        await apiClient.put(`/reports/${selected.id}`, payload);
        toast.success("Report updated");
      } else {
        await apiClient.post("/reports", payload);
        toast.success("Report created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/reports/${selected.id}`);
      toast.success("Report deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete report");
    } finally {
      setSaving(false);
    }
  };

  const deptName = (id: string) =>
    data.departments.find((d) => d.id === id)?.departmentName ?? "—";

  const columns: Column<IReport>[] = [
    { key: "scope", label: "Scope", render: (item) => formatEnum(item.scope) },
    {
      key: "department",
      label: "Department",
      render: (item) => deptName(String(item.department || "")),
    },
    {
      key: "generatedBy",
      label: "Generated By",
      render: (item) => {
        const g = item.generatedBy;
        return g && typeof g === "object" && "name" in g
          ? (g as { name: string }).name
          : String(g || "—");
      },
    },
    {
      key: "metrics",
      label: "Metrics",
      render: (item) => renderMetrics(item.metrics),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          isDeptHead && !isAdmin
            ? "Reports for your department"
            : "Generate and manage institutional reports"
        }
        action={
          canEdit ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
            >
              <BsPlus className="me-1" />
              New Report
            </button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={
          canEdit
            ? (item) => (
                <div className="flex gap-1.5">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelected(item);
                      setModal("edit");
                    }}
                    title="Edit"
                  >
                    <BsPencil size={13} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => {
                      setSelected(item);
                      setModal("delete");
                    }}
                    title="Delete"
                  >
                    <BsTrash size={13} />
                  </button>
                </div>
              )
            : undefined
        }
      />
      <ReportFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        departments={data.departments}
        saving={saving}
        onSave={handleSave}
      />
      <DeleteModal
        show={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        saving={saving}
      />
    </>
  );
};

export default ReportPage;
