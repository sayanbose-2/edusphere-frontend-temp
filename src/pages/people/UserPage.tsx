import { useState, useEffect } from "react";
import { BsToggleOn, BsToggleOff, BsPencil, BsTrash } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  UserFormModal,
  type TUserCreateForm,
  type TUserEditForm,
} from "@/components/people/UserFormModal";
import { formatEnum } from "@/utils/formatters";
import { Status } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type { IUser, IPageResponse } from "@/types/academicTypes";

type TModalMode = "edit" | "delete" | "create" | null;

const UserPage = () => {
  const [items, setItems] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IUser | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<IPageResponse<IUser> | IUser[]>(
        "/users",
        { params: { size: 100 } },
      );
      const d = res.data;
      setItems(Array.isArray(d) ? d : (d.content ?? []));
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: TUserCreateForm) => {
    setSaving(true);
    try {
      await apiClient.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        roles: [data.role],
      });
      toast.success("Staff account created");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (data: TUserEditForm) => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.patch(`/users/${selected.id}`, {
        name: data.name,
        phone: data.phone,
        status: data.status,
        roles: selected.roles,
      });
      toast.success("User updated");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: IUser) => {
    try {
      await apiClient.patch(`/users/${item.id}`, {
        status: item.status === "ACTIVE" ? Status.INACTIVE : Status.ACTIVE,
      });
      toast.success("Status updated");
      load();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/users/${selected.id}`);
      toast.success("User deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<IUser>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "roles",
      label: "Roles",
      render: (item) => item.roles?.map((r) => formatEnum(r)).join(", ") || "—",
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
        title="Users"
        subtitle="Manage system accounts and access"
        action={
          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setModal("create")}
          >
            Create Staff Account
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
              className={`icon-btn ${item.status === "ACTIVE" ? "icon-btn-warn" : "icon-btn-success"}`}
              onClick={() => handleToggle(item)}
              title="Toggle status"
            >
              {item.status === "ACTIVE" ? (
                <BsToggleOn size={15} />
              ) : (
                <BsToggleOff size={15} />
              )}
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
      <UserFormModal
        mode={modal === "create" || modal === "edit" ? modal : null}
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={selected}
        saving={saving}
        onCreate={handleCreate}
        onSave={handleSave}
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

export default UserPage;
