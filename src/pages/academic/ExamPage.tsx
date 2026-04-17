import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus, BsCheckCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import {
  ExamFormModal,
  type TExamForm,
} from "@/components/academic/ExamFormModal";
import { ExamCompleteModal } from "@/components/academic/ExamCompleteModal";
import { Role, Status } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IExam,
  ICourse,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "create" | "edit" | "delete" | "complete" | null;

const ExamPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState<{ courses: ICourse[]; items: IExam[] }>({
    courses: [],
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IExam | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isDeptHead) {
        const [allCourses, depts, allExams] = await Promise.all([
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
            .get<IPageResponse<IExam>>("/exams", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        const myDept = depts.find((d) => d.headId === user?.id);
        const deptCourseIds = new Set(
          allCourses
            .filter((c) => c.departmentId === myDept?.id)
            .map((c) => c.id),
        );
        setData({
          courses: allCourses.filter((c) => deptCourseIds.has(c.id)),
          items: allExams.filter((e) => deptCourseIds.has(e.courseId)),
        });
      } else {
        const [e, c] = await Promise.all([
          apiClient
            .get<IPageResponse<IExam>>("/exams", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<ICourse>>("/courses", { params: { size: 100 } })
            .then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.content ?? []),
            ),
        ]);
        setData({ items: e, courses: c });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500) toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TExamForm) => {
    setSaving(true);
    try {
      const payload = { ...formData, status: Status.ACTIVE };
      if (selected) {
        await apiClient.put(`/exams/${selected.id}`, payload);
        toast.success("Exam updated");
      } else {
        await apiClient.post("/exams", payload);
        toast.success("Exam created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/exams/${selected.id}`);
      toast.success("Exam deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete exam");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`/exams/${selected.id}`, {
        courseId: selected.courseId,
        type: selected.type,
        date: selected.date,
        status: Status.COMPLETED,
      });
      toast.success("Exam marked as completed. Grades can now be submitted.");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to mark exam as completed");
    } finally {
      setSaving(false);
    }
  };

  const courseName = (id: string) =>
    data.courses.find((c) => c.id === id)?.title ?? "—";
  const isPastExam = (item: IExam) => new Date(item.date) < new Date();

  const columns: Column<IExam>[] = [
    {
      key: "courseId",
      label: "Exam",
      render: (item) => (
        <span>
          <span className="font-medium">{courseName(item.courseId)}</span>
          <span className="mx-1.5 text-tertiary">·</span>
          <StatusBadge status={item.type} />
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item) =>
        new Date(item.date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
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
        title="Exams"
        subtitle={
          isDeptHead
            ? "Exams for your department courses"
            : "Manage examinations and assessments"
        }
        action={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
          >
            <BsPlus className="me-1" />
            Add Exam
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={(item) => (
          <div className="flex gap-1.5">
            {item.status === Status.ACTIVE && isPastExam(item) && (
              <button
                className="icon-btn icon-btn-success"
                onClick={() => {
                  setSelected(item);
                  setModal("complete");
                }}
                title="Mark as Completed"
              >
                <BsCheckCircle size={14} />
              </button>
            )}
            {item.status !== Status.COMPLETED && (
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
            )}
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
      <ExamFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        selected={modal === "edit" ? selected : null}
        courses={data.courses}
        saving={saving}
        onSave={handleSave}
      />
      <ExamCompleteModal
        show={modal === "complete"}
        onHide={() => setModal(null)}
        selected={selected}
        courseName={courseName}
        saving={saving}
        onConfirm={handleMarkComplete}
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

export default ExamPage;
