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
  ThesisFormModal,
  type TThesisForm,
} from "@/components/research/ThesisFormModal";
import { ThesisStatusModal } from "@/components/research/ThesisStatusModal";
import { Role, ThesisStatus } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IThesis,
  IStudent,
  IFaculty,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode = "form" | "status" | "delete" | null;

const ThesisPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;
  const isStudent = user?.roles.includes(Role.STUDENT) ?? false;

  const [data, setData] = useState<{
    items: IThesis[];
    students: IStudent[];
    faculties: IFaculty[];
  }>({ items: [], students: [], faculties: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IThesis | null>(null);
  const [saving, setSaving] = useState(false);
  const [myStudentId, setMyStudentId] = useState("");
  const [statusValue, setStatusValue] = useState<ThesisStatus>(
    ThesisStatus.SUBMITTED,
  );

  const load = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const [thesisData, me] = await Promise.all([
          apiClient
            .get<IPageResponse<IThesis>>("/theses/my")
            .then((r) => r.data.content ?? []),
          apiClient.get<{ id: string }>("/students/me").then((r) => r.data),
        ]);
        setData((d) => ({ ...d, items: thesisData }));
        setMyStudentId(me.id);
        try {
          const f = await apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []);
          setData((d) => ({ ...d, faculties: f }));
        } catch {
          /* no permission */
        }
      } else if (isFaculty) {
        const [theses, stu] = await Promise.all([
          apiClient
            .get<
              IPageResponse<IThesis>
            >("/theses/my", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<
              IPageResponse<IStudent>
            >("/students", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        setData((d) => ({ ...d, items: theses, students: stu }));
      } else {
        const [t, s, f] = await Promise.all([
          apiClient
            .get<IPageResponse<IThesis>>("/theses", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<
              IPageResponse<IStudent>
            >("/students", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        setData({ items: t, students: s, faculties: f });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error("Failed to load theses");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleSave = async (formData: TThesisForm) => {
    setSaving(true);
    try {
      const payload = {
        studentId: formData.studentId || myStudentId,
        title: formData.title,
        supervisorId: formData.supervisorId,
        submissionDate: formData.submissionDate,
        status: formData.status,
      };
      if (selected) {
        await apiClient.put(`/theses/${selected.id}`, payload);
        toast.success("Thesis updated");
      } else {
        await apiClient.post("/theses", payload);
        toast.success(isStudent ? "Thesis submitted" : "Thesis created");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save thesis");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`/theses/${selected.id}`, {
        studentId: selected.studentId,
        title: selected.title,
        supervisorId: selected.supervisorId,
        submissionDate: selected.submissionDate,
        status: statusValue,
      });
      toast.success("Thesis status updated");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/theses/${selected.id}`);
      toast.success("Thesis deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete thesis");
    } finally {
      setSaving(false);
    }
  };

  const studentName = (id: string) =>
    data.students.find((s) => s.id === id)?.name ?? "—";
  const facultyName = (id: string) =>
    data.faculties.find((f) => f.id === id)?.name ?? "—";

  const columns: Column<IThesis>[] = [
    ...(!isStudent
      ? [
          {
            key: "studentId" as const,
            label: "Student",
            render: (item: IThesis) => studentName(item.studentId),
          },
        ]
      : []),
    { key: "title", label: "Title" },
    ...(!isFaculty
      ? [
          {
            key: "supervisorId" as const,
            label: "Supervisor",
            render: (item: IThesis) => facultyName(item.supervisorId),
          },
        ]
      : []),
    {
      key: "submissionDate",
      label: "Submitted",
      render: (item) => new Date(item.submissionDate).toLocaleDateString(),
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
        title={
          isFaculty ? "Thesis Supervision" : isStudent ? "My Thesis" : "Theses"
        }
        subtitle={
          isFaculty
            ? "Manage theses you supervise"
            : isStudent
              ? "View and submit your thesis"
              : "Manage student thesis submissions"
        }
        action={
          isAdmin || isStudent ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelected(null);
                setModal("form");
              }}
            >
              <BsPlus className="me-1" />
              {isStudent ? "Submit New Thesis" : "Add Thesis"}
            </button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={(item) => (
          <div className="flex gap-1.5">
            {(isAdmin || isFaculty) && (
              <button
                className="icon-btn"
                onClick={() => {
                  setSelected(item);
                  setModal(isFaculty ? "status" : "form");
                  if (isFaculty) setStatusValue(item.status);
                }}
                disabled={!item.id}
                title={isFaculty ? "Update status" : "Edit"}
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
                disabled={!item.id}
              >
                <BsTrash size={13} />
              </button>
            )}
          </div>
        )}
      />
      <ThesisFormModal
        show={modal === "form"}
        onHide={() => setModal(null)}
        selected={selected}
        students={data.students}
        faculties={data.faculties}
        isStudent={isStudent}
        isAdmin={isAdmin}
        myStudentId={myStudentId}
        saving={saving}
        onSave={handleSave}
      />
      <ThesisStatusModal
        show={modal === "status"}
        onHide={() => setModal(null)}
        selected={selected}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
        studentName={studentName}
        saving={saving}
        onSave={handleStatusUpdate}
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

export default ThesisPage;
