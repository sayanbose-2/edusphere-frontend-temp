import { useState, useEffect } from "react";
import {
  BsPencil,
  BsTrash,
  BsPlus,
  BsToggleOn,
  BsToggleOff,
} from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  CourseFormModal,
  type TCourseForm,
} from "@/components/academic/CourseFormModal";
import { Role, Status } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  ICourse,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const CoursePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState<{
    items: ICourse[];
    departments: IDepartment[];
  }>({ items: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<ICourse | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [deptsRes, coursesRes] = await Promise.allSettled([
        apiClient.get<IPageResponse<IDepartment>>("/departments", {
          params: { size: 100 },
        }),
        apiClient.get<IPageResponse<ICourse> | ICourse[]>("/courses", {
          params: { size: 100 },
        }),
      ]);

      const depts =
        deptsRes.status === "fulfilled"
          ? (deptsRes.value.data.content ?? [])
          : [];
      if (deptsRes.status === "rejected") {
        const st = (deptsRes.reason as { response?: { status?: number } })
          ?.response?.status;
        if (st !== 404 && st !== 500) toast.error("Failed to load departments");
      }

      if (coursesRes.status === "rejected") {
        const st = (coursesRes.reason as { response?: { status?: number } })
          ?.response?.status;
        if (st !== 404 && st !== 500) toast.error("Failed to load courses");
        setData({ departments: depts, items: [] });
        return;
      }

      const raw = coursesRes.value.data;
      const allCourses: ICourse[] = Array.isArray(raw)
        ? raw
        : (raw.content ?? []);

      if (isDeptHead && !isAdmin) {
        const myDept = depts.find((d) => d.headId === user?.id);
        setData({
          departments: depts,
          items: myDept
            ? allCourses.filter((c) => c.departmentId === myDept.id)
            : [],
        });
      } else {
        setData({ departments: depts, items: allCourses });
      }
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TCourseForm) => {
    setSaving(true);
    try {
      const payload = { ...formData, status: Status.ACTIVE };
      if (selected) {
        await apiClient.put(`/courses/${selected.id}`, payload);
        toast.success("Course updated");
      } else {
        await apiClient.post("/courses", payload);
        toast.success("Course created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: ICourse) => {
    try {
      const newStatus =
        item.status === "ACTIVE" ? Status.INACTIVE : Status.ACTIVE;
      await apiClient.put(
        `/courses/${item.id}/status`,
        JSON.stringify(newStatus),
        { headers: { "Content-Type": "application/json" } },
      );
      toast.success("Status updated");
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/courses/${selected.id}`);
      toast.success("Course deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setSaving(false);
    }
  };

  const deptName = (id: string) =>
    data.departments.find((d) => d.id === id)?.departmentName ?? "—";

  const columns: Column<ICourse>[] = [
    { key: "title", label: "Title" },
    {
      key: "departmentId",
      label: "Department",
      render: (item) => deptName(item.departmentId),
    },
    { key: "credits", label: "Credits" },
    { key: "duration", label: "Duration (sem)" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle={
          isDeptHead && !isAdmin
            ? "Courses in your department"
            : "Manage academic courses"
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
              Add Course
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
              )
            : undefined
        }
      />
      <CourseFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        departments={data.departments}
        saving={saving}
        onSave={handleSave}
      />
      <DeleteModal
        show={modal === "delete"}
        label={selected?.title}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        saving={saving}
      />
    </>
  );
};

export default CoursePage;
