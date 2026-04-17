import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus, BsPersonCheck } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  DepartmentFormModal,
  type TDepartmentForm,
} from "@/components/people/DepartmentFormModal";
import { DepartmentAssignModal } from "@/components/people/DepartmentAssignModal";
import { Role } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IDepartment,
  IFaculty,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | "assign" | null;

const DepartmentPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState<{
    items: IDepartment[];
    faculties: IFaculty[];
  }>({ items: [], faculties: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IDepartment | null>(null);
  const [saving, setSaving] = useState(false);
  const [headId, setHeadId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([
        apiClient
          .get<
            IPageResponse<IDepartment>
          >("/departments", { params: { size: 100 } })
          .then((r) => r.data.content ?? []),
        apiClient
          .get<IPageResponse<IFaculty>>("/faculties", { params: { size: 100 } })
          .then((r) => r.data.content ?? []),
      ]);
      setData({
        items:
          isDeptHead && !isAdmin
            ? d.filter((dept) => dept.headId === user?.id)
            : d,
        faculties: f,
      });
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TDepartmentForm) => {
    setSaving(true);
    try {
      if (selected) {
        await apiClient.put(`/departments/${selected.id}`, formData);
        toast.success("Department updated");
      } else {
        await apiClient.post("/departments", formData);
        toast.success("Department created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignHead = async () => {
    if (!selected || !headId) {
      toast.error("Select a faculty member");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(`/departments/${selected.id}/head`, null, {
        params: { headId },
      });
      const newHead = data.faculties.find((f) => f.id === headId);
      if (newHead)
        await apiClient.patch(`/users/${newHead.userId}`, {
          roles: [Role.FACULTY, Role.DEPARTMENT_HEAD],
          replaceRoles: true,
        });
      if (selected.headId && selected.headId !== headId) {
        const prevHead = data.faculties.find((f) => f.id === selected.headId);
        if (prevHead)
          await apiClient.patch(`/users/${prevHead.userId}`, {
            roles: [Role.FACULTY],
            replaceRoles: true,
          });
      }
      toast.success("Department head assigned");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to assign head");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/departments/${selected.id}`);
      toast.success("Department deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<IDepartment>[] = [
    { key: "departmentName", label: "Name" },
    { key: "departmentCode", label: "Code" },
    { key: "contactInfo", label: "Contact" },
    {
      key: "headName",
      label: "Head",
      render: (item) =>
        item.headName ??
        data.faculties.find((f) => f.id === item.headId)?.name ??
        "—",
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
        title="Departments"
        subtitle={
          isDeptHead && !isAdmin
            ? "Your department"
            : "Manage academic departments"
        }
        action={
          isAdmin ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
            >
              <BsPlus className="me-1" />
              Add Department
            </button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={
          isAdmin
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
                    className="icon-btn icon-btn-success"
                    onClick={() => {
                      setSelected(item);
                      setHeadId("");
                      setModal("assign");
                    }}
                    title="Assign Head"
                  >
                    <BsPersonCheck size={14} />
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
      <DepartmentFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        saving={saving}
        onSave={handleSave}
      />
      <DepartmentAssignModal
        show={modal === "assign"}
        onHide={() => setModal(null)}
        selected={selected}
        faculties={data.faculties}
        headId={headId}
        onHeadIdChange={setHeadId}
        saving={saving}
        onAssign={handleAssignHead}
      />
      <DeleteModal
        show={modal === "delete"}
        label={selected?.departmentName}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        saving={saving}
      />
    </>
  );
};

export default DepartmentPage;
