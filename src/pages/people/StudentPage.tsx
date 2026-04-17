import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  StudentFormModal,
  type TStudentCreateForm,
  type TStudentEditForm,
} from "@/components/people/StudentFormModal";
import { Role } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { Column } from "@/components/common/DataTable";
import type { IStudent, IPageResponse } from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const StudentPage = () => {
  const [items, setItems] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IStudent | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<IPageResponse<IStudent> | IStudent[]>(
        "/students",
        { params: { size: 100 } },
      );
      const d = res.data;
      setItems(Array.isArray(d) ? d : (d.content ?? []));
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: TStudentCreateForm) => {
    setSaving(true);
    try {
      await apiClient.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        roles: [Role.STUDENT],
      });
      toast.success("Student account created");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to create student");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: TStudentEditForm) => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`/students/${selected.id}`, {
        userId: selected.userId,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
      });
      toast.success("Student profile updated");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/users/${selected.userId}`);
      toast.success("Student deleted");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to delete student");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<IStudent>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "gender",
      label: "Gender",
      render: (item) => (item.gender ? formatEnum(item.gender) : "—"),
    },
    {
      key: "enrollmentDate",
      label: "Enrolled",
      render: (item) =>
        item.enrollmentDate
          ? new Date(item.enrollmentDate).toLocaleDateString()
          : "—",
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
        title="Students"
        subtitle="Manage student accounts"
        action={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
          >
            <BsPlus className="me-1" />
            Add Student
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
        )}
      />
      <StudentFormModal
        mode={modal === "create" || modal === "edit" ? modal : null}
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={selected}
        saving={saving}
        onCreate={handleCreate}
        onEdit={handleEdit}
      />
      <DeleteModal
        show={modal === "delete"}
        label={selected?.name}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        saving={saving}
      />
    </>
  );
};

export default StudentPage;
