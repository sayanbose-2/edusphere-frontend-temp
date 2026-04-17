import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { decodeJwt } from "@/lib/jwt";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  FacultyFormModal,
  type TFacultyCreateForm,
  type TFacultyEditForm,
} from "@/components/people/FacultyFormModal";
import { Role, Status } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IFaculty,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const FacultyPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState<{
    departments: IDepartment[];
    items: IFaculty[];
  }>({ departments: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IFaculty | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const depts = await apiClient
        .get<
          IPageResponse<IDepartment>
        >("/departments", { params: { size: 100 } })
        .then((r) => r.data.content ?? []);
      if (isDeptHead && !isAdmin) {
        const myDept = depts.find((d) => d.headId === user?.id);
        const fac = myDept
          ? await apiClient
              .get<
                IPageResponse<IFaculty>
              >(`/departments/${myDept.id}/faculty`, { params: { size: 100 } })
              .then((r) => r.data.content ?? [])
          : [];
        setData({ departments: depts, items: fac });
      } else {
        setData({
          departments: depts,
          items: await apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleCreate = async (formData: TFacultyCreateForm) => {
    setSaving(true);
    try {
      const authResp = await apiClient
        .post<{
          accessToken: string;
        }>("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roles: [Role.FACULTY],
        })
        .then((r) => r.data);
      const decoded = decodeJwt(authResp.accessToken);
      await apiClient.post("/faculties", {
        userId: decoded.userId,
        position: formData.position,
        departmentId: formData.departmentId,
        status: Status.ACTIVE,
      });
      toast.success("Faculty member created");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to create faculty");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (formData: TFacultyEditForm) => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`/faculties/${selected.id}`, {
        userId: selected.userId,
        position: formData.position,
        departmentId: formData.departmentId,
        status: formData.status,
      });
      toast.success("Faculty updated");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to update faculty");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/users/${selected.userId}`);
      toast.success("Faculty deleted");
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Failed to delete faculty");
    } finally {
      setSaving(false);
    }
  };

  const deptHeadIds = new Set(
    data.departments.map((d) => d.headId).filter(Boolean),
  );

  const columns: Column<IFaculty>[] = [
    {
      key: "name",
      label: "Name",
      render: (item) => (
        <span className="flex items-center gap-1.5">
          {item.name}
          {deptHeadIds.has(item.id) && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-navy text-white tracking-wider whitespace-nowrap">
              Dept. Head
            </span>
          )}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "position", label: "Position" },
    {
      key: "departmentId",
      label: "Department",
      render: (item) =>
        item.departmentName ??
        data.departments.find((d) => d.id === item.departmentId)
          ?.departmentName ??
        "—",
    },
    {
      key: "joinDate",
      label: "Joined",
      render: (item) =>
        item.joinDate ? new Date(item.joinDate).toLocaleDateString() : "—",
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
        title="Faculty"
        subtitle={
          isDeptHead && !isAdmin
            ? "Faculty in your department"
            : "Manage faculty members"
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
              Add Faculty
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
      <FacultyFormModal
        mode={modal === "create" || modal === "edit" ? modal : null}
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={selected}
        departments={data.departments}
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

export default FacultyPage;
