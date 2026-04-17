import { useState, useEffect } from "react";
import { BsEye } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AuditReviewModal } from "@/components/compliance/AuditReviewModal";
import { AuditStatus, Role } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { Column } from "@/components/common/DataTable";
import type { IAudit, IAuditLog } from "@/types/complianceTypes";

interface IReviewForm {
  findings: string;
  auditStatus: AuditStatus;
}

// audit page covers both compliance audits (review) and system audit logs (admin)
const AuditPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const showLogs = isAdmin;

  const [tab, setTab] = useState<"audits" | "logs">("audits");
  const [audits, setAudits] = useState<IAudit[]>([]);
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [filters, setFilters] = useState({ severity: "" });
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<IAudit | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAudits = async () => {
    setAuditsLoading(true);
    try {
      setAudits(await apiClient.get<IAudit[]>("/audits").then((r) => r.data));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500)
        toast.error("Failed to load audits");
    } finally {
      setAuditsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      setLogs(
        await apiClient.get<IAuditLog[]>("/audit-logs").then((r) => r.data),
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500)
        toast.error("Failed to load audit logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
    if (isAdmin) loadLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (form: IReviewForm) => {
    if (!selectedAudit) return;
    setSaving(true);
    try {
      await apiClient.put(`/audits/${selectedAudit.id}/review`, {
        findings: form.findings,
        status: form.auditStatus,
      });
      toast.success("Audit reviewed");
      setReviewModal(false);
      loadAudits();
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const auditColumns: Column<IAudit>[] = [
    {
      key: "entityType",
      label: "Entity Type",
      render: (a) => formatEnum(a.entityType),
    },
    { key: "scope", label: "Scope" },
    {
      key: "findings",
      label: "Findings",
      render: (a) =>
        a.findings
          ? a.findings.length > 55
            ? a.findings.slice(0, 55) + "…"
            : a.findings
          : "—",
    },
    {
      key: "auditDate",
      label: "Date",
      render: (a) => new Date(a.auditDate).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (a) => <StatusBadge status={a.status} />,
    },
  ];

  const filteredLogs = filters.severity
    ? logs.filter((l) => l.severity === filters.severity)
    : logs;

  const logColumns: Column<IAuditLog>[] = [
    { key: "action", label: "Action" },
    { key: "resource", label: "Resource" },
    {
      key: "logType",
      label: "Type",
      render: (item) => formatEnum(item.logType),
    },
    {
      key: "severity",
      label: "Severity",
      render: (item) => <StatusBadge status={item.severity} />,
    },
    {
      key: "details",
      label: "Details",
      render: (item) =>
        item.details
          ? item.details.length > 60
            ? item.details.slice(0, 60) + "…"
            : item.details
          : "—",
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (item) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
    },
  ];

  return (
    <>
      <PageHeader
        title="Audits"
        subtitle={
          tab === "logs"
            ? "System activity log — read only"
            : "Review and manage compliance audits"
        }
      />

      {showLogs && (
        <div className="flex gap-1 mb-5 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "audits" ? "border-blue text-blue" : "border-transparent text-secondary hover:text-base"}`}
            onClick={() => setTab("audits")}
          >
            Compliance Audits
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === "logs" ? "border-blue text-blue" : "border-transparent text-secondary hover:text-base"}`}
            onClick={() => setTab("logs")}
          >
            System Audit Logs
          </button>
        </div>
      )}

      {tab === "audits" && (
        <DataTable
          columns={auditColumns}
          data={audits}
          loading={auditsLoading}
          actions={(item) => (
            <button
              className="icon-btn"
              onClick={() => {
                setSelectedAudit(item);
                setReviewModal(true);
              }}
              title="Review"
            >
              <BsEye size={13} />
            </button>
          )}
        />
      )}

      {tab === "logs" && showLogs && (
        <>
          <div className="flex items-center gap-2.5 mb-4">
            <label className="form-label m-0 whitespace-nowrap">
              Filter by severity
            </label>
            <select
              className="form-select form-select-sm max-w-40"
              value={filters.severity}
              onChange={(e) =>
                setFilters((f) => ({ ...f, severity: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <DataTable
            columns={logColumns}
            data={filteredLogs}
            loading={logsLoading}
          />
        </>
      )}

      <AuditReviewModal
        show={reviewModal}
        onHide={() => setReviewModal(false)}
        selected={selectedAudit}
        saving={saving}
        onSave={handleReview}
      />
    </>
  );
};

export default AuditPage;
