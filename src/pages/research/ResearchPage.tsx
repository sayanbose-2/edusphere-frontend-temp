import { useState, useEffect } from "react";
import { BsTrash, BsPlus, BsPersonPlus, BsMortarboard } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import { ResearchFormModal } from "@/components/research/ResearchFormModal";
import { ManageFacultyModal } from "@/components/research/ManageFacultyModal";
import { ManageStudentModal } from "@/components/research/ManageStudentModal";
import { Role } from "@/types/enums";
import type { Column } from "@/components/common/DataTable";
import type {
  IResearchProject,
  IFaculty,
  IStudent,
  IPageResponse,
} from "@/types/academicTypes";

type TModalMode =
  | "create"
  | "delete"
  | "manageFaculty"
  | "manageStudent"
  | null;

const ResearchPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;

  const [data, setData] = useState<{
    items: IResearchProject[];
    faculties: IFaculty[];
    students: IStudent[];
  }>({ items: [], faculties: [], students: [] });
  const [addId, setAddId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IResearchProject | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const allProjects = await apiClient
        .get<
          IPageResponse<IResearchProject>
        >("/research-projects", { params: { size: 100 } })
        .then((r) => r.data.content ?? []);

      if (isFaculty) {
        const me = await apiClient
          .get<{ id: string }>("/faculties/me")
          .then((r) => r.data);
        const items = allProjects.filter(
          (p) =>
            p.facultyId === me.id || p.facultyMembersIdList?.includes(me.id),
        );
        const uniqueFacultyIds = [
          ...new Set(
            items
              .flatMap((p) => [p.facultyId, ...(p.facultyMembersIdList ?? [])])
              .filter(Boolean),
          ),
        ];
        const uniqueStudentIds = [
          ...new Set(
            items.flatMap((p) => p.studentsList ?? []).filter(Boolean),
          ),
        ];
        const [faculties, students] = await Promise.all([
          Promise.all(
            uniqueFacultyIds.map((id) =>
              apiClient
                .get<IFaculty>(`/faculties/${id}`)
                .then((r) => r.data)
                .catch(() => null),
            ),
          ),
          Promise.all(
            uniqueStudentIds.map((id) =>
              apiClient
                .get<IStudent>(`/students/${id}`)
                .then((r) => r.data)
                .catch(() => null),
            ),
          ),
        ]);
        setData({
          items,
          faculties: faculties.filter(Boolean) as IFaculty[],
          students: students.filter(Boolean) as IStudent[],
        });
      } else if (user?.roles.includes(Role.STUDENT)) {
        const me = await apiClient
          .get<IStudent>("/students/me")
          .then((r) => r.data);
        const items = allProjects.filter((p) =>
          p.studentsList?.includes(me.id),
        );
        const uniqueFacultyIds = [
          ...new Set(
            items
              .flatMap((p) => [p.facultyId, ...(p.facultyMembersIdList ?? [])])
              .filter(Boolean),
          ),
        ];
        const uniqueStudentIds = [
          ...new Set(
            items.flatMap((p) => p.studentsList ?? []).filter(Boolean),
          ),
        ];
        const [faculties, students] = await Promise.all([
          Promise.all(
            uniqueFacultyIds.map((id) =>
              apiClient
                .get<IFaculty>(`/faculties/${id}`)
                .then((r) => r.data)
                .catch(() => null),
            ),
          ),
          Promise.all(
            uniqueStudentIds.map((id) =>
              apiClient
                .get<IStudent>(`/students/${id}`)
                .then((r) => r.data)
                .catch(() => null),
            ),
          ),
        ]);
        setData((d) => ({
          ...d,
          items,
          faculties: faculties.filter(Boolean) as IFaculty[],
          students: students.filter(Boolean) as IStudent[],
        }));
      } else {
        const [f, s] = await Promise.all([
          apiClient
            .get<
              IPageResponse<IFaculty>
            >("/faculties", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
          apiClient
            .get<
              IPageResponse<IStudent>
            >("/students", { params: { size: 100 } })
            .then((r) => r.data.content ?? []),
        ]);
        setData({ items: allProjects, faculties: f, students: s });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500)
        toast.error("Failed to load research projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected)
      setSelected(data.items.find((i) => i.id === selected.id) ?? null);
  }, [data.items]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleCreate = async (formData: {
    title: string;
    facultyId: string;
    startDate: string;
    endDate: string;
    status: string;
  }) => {
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        facultyId: formData.facultyId,
        facultyMembers: [],
        students: [],
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };
      await apiClient.post("/research-projects", payload);
      toast.success("Project created");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/research-projects/${selected.id}`);
      toast.success("Project deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaculty = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await apiClient.post(`/research-projects/${selected.id}/faculty`, null, {
        params: { facultyId: addId },
      });
      toast.success("Co-investigator added");
      setAddId("");
      load();
    } catch {
      toast.error("Failed to add co-investigator");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFaculty = async (fId: string) => {
    if (!selected) return;
    try {
      await apiClient.delete(
        `/research-projects/${selected.id}/faculty/${fId}`,
      );
      toast.success("Co-investigator removed");
      load();
    } catch {
      toast.error("Failed to remove co-investigator");
    }
  };

  const handleAddStudent = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await apiClient.post(`/research-projects/${selected.id}/students`, null, {
        params: { studentId: addId },
      });
      toast.success("Student added");
      setAddId("");
      load();
    } catch {
      toast.error("Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (sId: string) => {
    if (!selected) return;
    try {
      await apiClient.delete(
        `/research-projects/${selected.id}/students/${sId}`,
      );
      toast.success("Student removed");
      load();
    } catch {
      toast.error("Failed to remove student");
    }
  };

  const facultyName = (id: string) =>
    data.faculties.find((f) => f.id === id)?.name ?? "—";
  const studentName = (id: string) =>
    data.students.find((s) => s.id === id)?.name ?? "—";
  const canManage = isAdmin || isFaculty;

  const columns: Column<IResearchProject>[] = [
    { key: "title", label: "Title" },
    {
      key: "facultyId",
      label: "Lead Faculty",
      render: (item) => facultyName(item.facultyId),
    },
    {
      key: "startDate",
      label: "Start",
      render: (item) => new Date(item.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      label: "End",
      render: (item) => new Date(item.endDate).toLocaleDateString(),
    },
    {
      key: "facultyMembersIdList",
      label: "Co-Investigators",
      render: (item) =>
        item.facultyMembersIdList?.length ? (
          <div className="flex flex-col gap-1">
            {item.facultyMembersIdList.map((id) => (
              <span
                key={id}
                className="text-xs bg-blue/10 text-blue rounded-full px-2 py-0.5 font-semibold w-fit"
              >
                {facultyName(id)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-secondary text-sm">—</span>
        ),
    },
    {
      key: "studentsList",
      label: "Students",
      render: (item) =>
        item.studentsList?.length ? (
          <div className="flex flex-col gap-1">
            {item.studentsList.map((id) => (
              <span
                key={id}
                className="text-xs bg-green-600/10 text-green-600 rounded-full px-2 py-0.5 font-semibold w-fit"
              >
                {studentName(id)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-secondary text-sm">—</span>
        ),
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
        title="Research Projects"
        subtitle={
          user?.roles.includes(Role.STUDENT)
            ? "Projects you are part of"
            : isFaculty
              ? "Projects you lead or co-investigate"
              : "Manage research and academic projects"
        }
        action={
          canManage ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModal("create")}
            >
              <BsPlus className="me-1" />
              New Project
            </button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={
          canManage
            ? (item) => (
                <div className="flex gap-1.5">
                  <button
                    className="icon-btn icon-btn-success"
                    onClick={() => {
                      setSelected(item);
                      setAddId("");
                      setModal("manageFaculty");
                    }}
                    title="Manage co-investigators"
                  >
                    <BsPersonPlus size={13} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelected(item);
                      setAddId("");
                      setModal("manageStudent");
                    }}
                    title="Manage students"
                  >
                    <BsMortarboard size={13} />
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
              )
            : undefined
        }
      />

      <ResearchFormModal
        show={modal === "create"}
        onHide={() => setModal(null)}
        faculties={data.faculties}
        onSave={handleCreate}
        saving={saving}
      />

      <ManageFacultyModal
        show={modal === "manageFaculty"}
        onHide={() => setModal(null)}
        selected={selected}
        faculties={data.faculties}
        addId={addId}
        onAddIdChange={setAddId}
        onAdd={handleAddFaculty}
        onRemove={handleRemoveFaculty}
        saving={saving}
        facultyName={facultyName}
      />

      <ManageStudentModal
        show={modal === "manageStudent"}
        onHide={() => setModal(null)}
        selected={selected}
        students={data.students}
        addId={addId}
        onAddIdChange={setAddId}
        onAdd={handleAddStudent}
        onRemove={handleRemoveStudent}
        saving={saving}
        studentName={studentName}
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

export default ResearchPage;
