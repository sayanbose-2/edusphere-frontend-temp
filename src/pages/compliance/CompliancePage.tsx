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
  ComplianceFormModal,
  type TComplianceForm,
} from "@/components/compliance/ComplianceFormModal";
import { Role } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { Column } from "@/components/common/DataTable";
import type { IComplianceRecord } from "@/types/complianceTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const CompliancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;

  const [items, setItems] = useState<IComplianceRecord[]>([]);
  const [entityNameMap, setEntityNameMap] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IComplianceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient
        .get<IComplianceRecord[]>("/compliance-records")
        .then((r) => r.data);
      setItems(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500)
        toast.error("Failed to load compliance records");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TComplianceForm) => {
    setSaving(true);
    try {
      const payload = {
        recordedByUserId: user?.id || "",
        entityId: formData.entityId,
        entityType: formData.entityType,
        complianceType: formData.complianceType,
        result: formData.result,
        complianceDate: formData.complianceDate,
        notes: formData.notes,
      };
      if (selected) {
        await apiClient.put(`/compliance-records/${selected.id}`, payload);
        toast.success("Record updated");
      } else {
        await apiClient.post("/compliance-records", payload);
        toast.success("Record created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/compliance-records/${selected.id}`);
      toast.success("Record deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<IComplianceRecord>[] = [
    {
      key: "entityType",
      label: "Entity Type",
      render: (item) => formatEnum(item.entityType),
    },
    {
      key: "entityId",
      label: "Entity",
      render: (item) =>
        entityNameMap[item.entityId] ?? (
          <span className="text-secondary italic" title={item.entityId}>
            {item.entityId.slice(0, 8)}…
          </span>
        ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (item) =>
        item.notes
          ? item.notes.length > 60
            ? item.notes.slice(0, 60) + "…"
            : item.notes
          : "—",
    },
    {
      key: "result",
      label: "Result",
      render: (item) => <StatusBadge status={item.result} />,
    },
    { key: "complianceDate", label: "Date" },
  ];

  return (
    <>
      <PageHeader
        title="Compliance Records"
        subtitle="Manage compliance records"
        action={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
          >
            <BsPlus className="me-1" />
            Add Record
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
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
            {isAdmin && (
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
            )}
          </div>
        )}
      />
      <ComplianceFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        saving={saving}
        onSave={(data) => {
          // update entity name map for display
          setEntityNameMap((m) => ({ ...m }));
          return handleSave(data);
        }}
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

export default CompliancePage;
