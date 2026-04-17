import { useState, useEffect } from "react";
import { BsPencil, BsTrash, BsPlus } from "react-icons/bs";
import { toast } from "react-toastify";
import apiClient from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import DeleteModal from "@/components/common/DeleteModal";
import { StudentGradeView } from "@/components/grade/StudentGradeView";
import { GradeFormModal } from "@/components/grade/GradeFormModal";
import { GradeFilters } from "@/components/grade/GradeFilters";
import { Role, Status, GradeStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { Column } from "@/components/common/DataTable";
import type {
  IGrade,
  IExam,
  IStudent,
  ICourse,
  IDepartment,
  IPageResponse,
} from "@/types/academicTypes";

const calcGrade = (score: number) => {
  if (score >= 90) return { letter: "A", status: GradeStatus.PASS };
  if (score >= 80) return { letter: "B", status: GradeStatus.PASS };
  if (score >= 70) return { letter: "C", status: GradeStatus.PASS };
  if (score >= 60) return { letter: "D", status: GradeStatus.PASS };
  return { letter: "F", status: GradeStatus.FAIL };
};

type TModalMode = "create" | "edit" | "delete" | null;

interface IGradeForm {
  examId: string;
  studentId: string;
  score: number;
  grade: string;
  gradeStatus: string;
}

const GradePage = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;
  const isStudent = user?.roles.includes(Role.STUDENT) ?? false;
  const canEdit = isAdmin || isDeptHead || isFaculty;

  const [data, setData] = useState<{
    items: IGrade[];
    allExams: IExam[];
    completedExams: IExam[];
    students: IStudent[];
    courses: ICourse[];
  }>({
    items: [],
    allExams: [],
    completedExams: [],
    students: [],
    courses: [],
  });
  const [gradeFormDefaults, setGradeFormDefaults] = useState<IGradeForm>({
    examId: "",
    studentId: "",
    score: 0,
    grade: "",
    gradeStatus: GradeStatus.PASS,
  });
  const [filters, setFilters] = useState({ studentId: "", examId: "" });
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const items = await apiClient
          .get<IPageResponse<IGrade>>("/grades/my")
          .then((r) => r.data.content ?? []);
        if (items.length > 0) {
          const uniqueExamIds = [...new Set(items.map((g) => g.examId))];
          const allExams = await Promise.all(
            uniqueExamIds.map((id) =>
              apiClient.get<IExam>(`/exams/${id}`).then((r) => r.data),
            ),
          );
          const uniqueCourseIds = [...new Set(allExams.map((e) => e.courseId))];
          const courses = await Promise.all(
            uniqueCourseIds.map((id) =>
              apiClient.get<ICourse>(`/courses/${id}`).then((r) => r.data),
            ),
          );
          setData((d) => ({ ...d, items, allExams, courses }));
        } else {
          setData((d) => ({ ...d, items }));
        }
      } else if (isDeptHead) {
        const [allCourses, depts] = await Promise.all([
          apiClient
            .get<IPageResponse<ICourse>>("/courses")
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<IDepartment>>("/departments")
            .then((r) => r.data.content ?? []),
        ]);
        const myDept = depts.find((d) => d.headId === user?.id);
        const deptCourseIds = new Set(
          allCourses
            .filter((c) => c.departmentId === myDept?.id)
            .map((c) => c.id),
        );
        const courses = allCourses.filter((c) => deptCourseIds.has(c.id));
        const [allExams, completedExams, students] = await Promise.all([
          apiClient
            .get<IPageResponse<IExam>>("/exams")
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`)
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<IStudent>>("/students")
            .then((r) => r.data.content ?? []),
        ]);
        const deptAllExams = allExams.filter((e) =>
          deptCourseIds.has(e.courseId),
        );
        const deptCompExams = completedExams.filter((e) =>
          deptCourseIds.has(e.courseId),
        );
        const items =
          deptCompExams.length > 0
            ? (
                await Promise.all(
                  deptCompExams.map((e) =>
                    apiClient
                      .get<IPageResponse<IGrade>>(`/grades/exam/${e.id}`)
                      .then((r) => r.data.content ?? []),
                  ),
                )
              ).flat()
            : [];
        setData({
          items,
          allExams: deptAllExams,
          completedExams: deptCompExams,
          students,
          courses,
        });
      } else if (isFaculty) {
        const [allCourses, allItems, completedExams, students] =
          await Promise.all([
            apiClient
              .get<IPageResponse<ICourse>>("/courses")
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IGrade>>("/grades")
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`)
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IStudent>>("/students")
              .then((r) => r.data.content ?? []),
          ]);
        try {
          const me = await apiClient
            .get<{ id: string }>("/faculties/me")
            .then((r) => r.data);
          const workloads = await apiClient
            .get<
              IPageResponse<{ courseId: string }> | { courseId: string }[]
            >(`/workloads/faculty/${me.id}`)
            .then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.content ?? []),
            );
          const assignedIds = new Set(workloads.map((w) => w.courseId));
          if (assignedIds.size > 0) {
            const myCompExams = completedExams.filter((e) =>
              assignedIds.has(e.courseId),
            );
            const myExamIds = new Set(myCompExams.map((e) => e.id));
            setData({
              items: allItems.filter((g) => myExamIds.has(g.examId)),
              allExams: myCompExams,
              completedExams: myCompExams,
              students,
              courses: allCourses.filter((c) => assignedIds.has(c.id)),
            });
          } else {
            setData({
              items: allItems,
              allExams: completedExams,
              completedExams,
              students,
              courses: allCourses,
            });
          }
        } catch {
          setData({
            items: allItems,
            allExams: completedExams,
            completedExams,
            students,
            courses: allCourses,
          });
        }
      } else if (isAdmin) {
        const [items, allExams, completedExams, students, courses] =
          await Promise.all([
            apiClient
              .get<IPageResponse<IGrade>>("/grades")
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IExam>>("/exams")
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`)
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<IStudent>>("/students")
              .then((r) => r.data.content ?? []),
            apiClient
              .get<IPageResponse<ICourse>>("/courses")
              .then((r) =>
                Array.isArray(r.data) ? r.data : (r.data.content ?? []),
              ),
          ]);
        setData({ items, allExams, completedExams, students, courses });
      } else {
        const [items, allExams] = await Promise.all([
          apiClient
            .get<IPageResponse<IGrade>>("/grades")
            .then((r) => r.data.content ?? []),
          apiClient
            .get<IPageResponse<IExam>>("/exams")
            .then((r) => r.data.content ?? []),
        ]);
        setData((d) => ({ ...d, items, allExams, completedExams: allExams }));
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 500)
        toast.error("Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [user?.id]);

  const filterByStudent = async (sid: string) => {
    setFilters({ studentId: sid, examId: "" });
    if (!sid) {
      load();
      return;
    }
    try {
      setLoading(true);
      setData((d) => ({ ...d, items: [] }));
      const items = await apiClient
        .get<IPageResponse<IGrade>>(`/grades/students/${sid}`)
        .then((r) => r.data.content ?? []);
      setData((d) => ({ ...d, items }));
    } catch {
      toast.error("Filter failed");
    } finally {
      setLoading(false);
    }
  };

  const filterByExam = async (eid: string) => {
    setFilters({ examId: eid, studentId: "" });
    if (!eid) {
      load();
      return;
    }
    try {
      setLoading(true);
      const items = await apiClient
        .get<IPageResponse<IGrade>>(`/grades/exam/${eid}`)
        .then((r) => r.data.content ?? []);
      setData((d) => ({ ...d, items }));
    } catch {
      toast.error("Filter failed");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setSelected(null);
    setGradeFormDefaults({
      examId: "",
      studentId: "",
      score: 0,
      grade: "",
      gradeStatus: GradeStatus.PASS,
    });
    setModal("create");
  };

  const openEdit = (item: IGrade) => {
    setSelected(item);
    setGradeFormDefaults({
      examId: item.examId,
      studentId: item.studentId,
      score: item.score,
      grade: item.grade,
      gradeStatus: item.status,
    });
    setModal("edit");
  };

  const handleSave = async (formData: IGradeForm) => {
    setSaving(true);
    try {
      const payload = {
        examId: formData.examId,
        studentId: formData.studentId,
        score: formData.score,
        grade: formData.grade,
        status: formData.gradeStatus,
      };
      if (modal === "edit" && selected) {
        await apiClient.put(`/grades/${selected.id}`, payload);
        toast.success("Grade updated");
      } else {
        await apiClient.post("/grades", payload);
        toast.success("Grade submitted");
      }
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      toast.error(msg || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/grades/${selected.id}`);
      toast.success("Grade deleted");
      setModal(null);
      load();
    } catch {
      toast.error("Failed to delete grade");
    } finally {
      setSaving(false);
    }
  };

  const courseName = (id: string) =>
    data.courses.find((c) => c.id === id)?.title ?? "—";
  const examLabel = (id: string) => {
    const e = data.allExams.find((x) => x.id === id);
    return e ? `${courseName(e.courseId)} — ${formatEnum(e.type)}` : "—";
  };
  const studentName = (id: string) =>
    data.students.find((s) => s.id === id)?.name ?? "—";

  if (isStudent) {
    return (
      <StudentGradeView
        loading={loading}
        items={data.items}
        allExams={data.allExams}
        courses={data.courses}
      />
    );
  }

  const columns: Column<IGrade>[] = [
    { key: "examId", label: "Exam", render: (item) => examLabel(item.examId) },
    {
      key: "studentId",
      label: "Student",
      render: (item) => studentName(item.studentId),
    },
    { key: "score", label: "Score", render: (item) => `${item.score}/100` },
    {
      key: "grade",
      label: "Grade",
      render: (item) => <strong className="text-base">{item.grade}</strong>,
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
        title="Grades"
        subtitle={
          isDeptHead
            ? "Grade results for your department"
            : isFaculty
              ? "Submit and manage grades for your courses"
              : "View and manage all student grades"
        }
        action={
          canEdit ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={openCreate}
              disabled={data.completedExams.length === 0}
            >
              <BsPlus className="me-1" />
              {isFaculty ? "Submit Grade" : "Add Grade"}
            </button>
          ) : undefined
        }
      />

      <GradeFilters
        isAdmin={isAdmin}
        isDeptHead={isDeptHead}
        isFaculty={isFaculty}
        students={data.students}
        allExams={data.allExams}
        filters={filters}
        onFilterStudent={filterByStudent}
        onFilterExam={filterByExam}
        courseName={courseName}
      />

      {data.completedExams.length === 0 && !loading && canEdit && (
        <div className="py-4 text-secondary text-sm">
          No completed exams yet. Mark an exam as completed before submitting
          grades.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        actions={
          canEdit
            ? (item) => (
                <div className="flex gap-1.5">
                  <button
                    className="icon-btn"
                    onClick={() => openEdit(item)}
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

      <GradeFormModal
        show={modal === "create" || modal === "edit"}
        onHide={() => setModal(null)}
        mode={modal === "create" || modal === "edit" ? modal : null}
        defaultValues={gradeFormDefaults}
        completedExams={data.completedExams}
        students={data.students}
        courseName={courseName}
        calcGrade={calcGrade}
        onSave={handleSave}
        saving={saving}
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

export default GradePage;
