import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import DeleteModal from "@/components/common/DeleteModal";
import {
  CurriculumFormModal,
  type TCurriculumForm,
} from "@/components/academic/CurriculumFormModal";
import { Role } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  ICurriculum,
  ICourse,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const countMods = (json: unknown): string => {
  try {
    const p = typeof json === "string" ? JSON.parse(json) : json;
    const n = Array.isArray(p) ? p.length : 0;
    return `${n} module${n !== 1 ? "s" : ""}`;
  } catch {
    return "—";
  }
};

const CurriculumPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState<{
    items: ICurriculum[];
    courses: ICourse[];
  }>({ items: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<ICurriculum | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cur, allCourses] = await Promise.all([
        apiClient
          .get<
            IPageResponse<ICurriculum>
          >("/curriculums", { params: { size: 100 } })
          .then((r) => r.data.content ?? []),
        apiClient
          .get<
            IPageResponse<ICourse> | ICourse[]
          >("/courses", { params: { size: 100 } })
          .then((r) =>
            Array.isArray(r.data) ? r.data : (r.data.content ?? []),
          ),
      ]);
      if (isDeptHead && !isAdmin) {
        const depts = await apiClient
          .get<
            IPageResponse<IDepartment>
          >("/departments", { params: { size: 100 } })
          .then((r) => r.data.content ?? []);
        const myDept = depts.find((d) => d.headId === user?.id);
        const deptCourseIds = new Set(
          allCourses
            .filter((c: ICourse) => c.departmentId === myDept?.id)
            .map((c: ICourse) => c.id),
        );
        setData({
          courses: allCourses.filter((c: ICourse) => deptCourseIds.has(c.id)),
          items: cur.filter((c) => deptCourseIds.has(c.courseId)),
        });
      } else {
        setData({ courses: allCourses, items: cur });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load curricula");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TCurriculumForm, modulesJSON: string) => {
    setSaving(true);
    try {
      const payload = {
        courseId: formData.courseId,
        description: formData.description,
        modulesJSON,
        status: formData.status,
      };
      if (selected) {
        await apiClient.put(`/curriculums/${selected.id}`, payload);
        toast.success("Curriculum updated");
      } else {
        await apiClient.post("/curriculums", payload);
        toast.success("Curriculum created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save curriculum");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/curriculums/${selected.id}`);
      toast.success("Curriculum deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete curriculum");
    } finally {
      setSaving(false);
    }
  };

  const courseName = (id: string) =>
    data.courses.find((c) => c.id === id)?.title ?? "—";

  const columns: Column<ICurriculum>[] = [
    {
      key: "courseId",
      label: "Course",
      render: (item) => courseName(item.courseId),
    },
    {
      key: "description",
      label: "Description",
      render: (item) =>
        item.description.length > 60
          ? item.description.slice(0, 60) + "…"
          : item.description,
    },
    {
      key: "modulesJSON",
      label: "Modules",
      render: (item) => countMods(item.modulesJSON),
    },
  ];

  return (
    <>
      <PageHeader
        title="Curricula"
        subtitle={
          isDeptHead && !isAdmin
            ? "Curricula for your department courses"
            : "Manage course curricula and modules"
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
              Add Curriculum
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
      <CurriculumFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        courses={data.courses}
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

export default CurriculumPage;
