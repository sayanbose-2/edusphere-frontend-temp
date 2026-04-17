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
  WorkloadFormModal,
  type TWorkloadForm,
} from "@/components/academic/WorkloadFormModal";
import { Role } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IWorkload,
  IFaculty,
  ICourse,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | null;

const WorkloadPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;

  const [data, setData] = useState<{
    items: IWorkload[];
    faculties: IFaculty[];
    courses: ICourse[];
  }>({ items: [], faculties: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IWorkload | null>(null);
  const [saving, setSaving] = useState(false);

  const getWorkloads = (r: unknown) => {
    const d = (r as { data: IPageResponse<IWorkload> | IWorkload[] }).data;
    return Array.isArray(d) ? d : (d.content ?? []);
  };

  const load = async () => {
    setLoading(true);
    try {
      if (isFaculty) {
        const me = await apiClient
          .get<{ id: string }>("/faculties/me")
          .then((r) => r.data);
        const [w, c] = await Promise.all([
          apiClient.get(`/workloads/faculty/${me.id}`).then(getWorkloads),
          apiClient
            .get<IPageResponse<ICourse>>("/courses", { params: { size: 100 } })
            .then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.content ?? []),
            ),
        ]);
        setData((d) => ({ ...d, items: w, courses: c }));
      } else if (isDeptHead) {
        const [allCourses, depts, allFaculties] = await Promise.all([
          apiClient
            .get<IPageResponse<ICourse>>("/courses", { params: { size: 100 } })
            .then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.content ?? []),
            ),
          apiClient
            .get<
              IPageResponse<IDepartment>
            >("/departments", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        const myDept = depts.find((d) => d.headId === user?.id);
        const deptCourseIds = new Set(
          allCourses
            .filter((c) => c.departmentId === myDept?.id)
            .map((c) => c.id),
        );
        const deptFaculties = allFaculties.filter(
          (f) => f.departmentId === myDept?.id,
        );
        const wArrays = await Promise.all(
          deptFaculties.map((f) =>
            apiClient
              .get(`/workloads/faculty/${f.id}`)
              .then(getWorkloads)
              .catch(() => []),
          ),
        );
        setData({
          items: wArrays.flat(),
          faculties: deptFaculties,
          courses: allCourses.filter((c) => deptCourseIds.has(c.id)),
        });
      } else {
        const [w, f, c] = await Promise.all([
          apiClient
            .get("/workloads", { params: { size: 100 } })
            .then(getWorkloads),
          apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<ICourse>>("/courses", { params: { size: 100 } })
            .then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.content ?? []),
            ),
        ]);
        setData({ items: w, faculties: f, courses: c });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load workloads");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TWorkloadForm) => {
    setSaving(true);
    try {
      if (selected) {
        await apiClient.put(`/workloads/${selected.id}`, formData);
        toast.success("Workload updated");
      } else {
        await apiClient.post("/workloads", formData);
        toast.success("Workload created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save workload");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/workloads/${selected.id}`);
      toast.success("Workload deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete workload");
    } finally {
      setSaving(false);
    }
  };

  const facultyName = (id: string) =>
    data.faculties.find((f) => f.id === id)?.name ?? "—";
  const courseName = (id: string) =>
    data.courses.find((c) => c.id === id)?.title ?? "—";

  const columns: Column<IWorkload>[] = [
    ...(isFaculty
      ? []
      : [
          {
            key: "facultyId" as const,
            label: "Faculty",
            render: (item: IWorkload) => facultyName(item.facultyId),
          },
        ]),
    {
      key: "courseId",
      label: "Course",
      render: (item) => courseName(item.courseId),
    },
    { key: "hours", label: "Hrs/Week" },
    { key: "semester", label: "Semester" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Workloads"
        subtitle={
          isFaculty
            ? "Your teaching assignments"
            : isDeptHead
              ? "Faculty workloads for your department"
              : "Manage faculty teaching assignments"
        }
        action={
          !isFaculty ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
            >
              <BsPlus className="me-1" />
              Add Workload
            </button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={
          !isFaculty
            ? (item) => (
                <div className="flex gap-1.5">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelected(item);
                      setModal("edit");
                    }}
                    disabled={!item.id}
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
                      disabled={!item.id}
                    >
                      <BsTrash size={13} />
                    </button>
                  )}
                </div>
              )
            : undefined
        }
      />
      <WorkloadFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        faculties={data.faculties}
        courses={data.courses}
        isFaculty={isFaculty}
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

export default WorkloadPage;
