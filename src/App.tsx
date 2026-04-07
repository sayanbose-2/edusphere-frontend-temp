import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { Role } from '@/types/enums';

// Admin pages
import UserList from '@/pages/admin/UserList';
import StudentCRUD from '@/pages/admin/StudentCRUD';
import FacultyCRUD from '@/pages/admin/FacultyCRUD';
import DepartmentCRUD from '@/pages/admin/DepartmentCRUD';
import CourseCRUD from '@/pages/admin/CourseCRUD';
import CurriculumCRUD from '@/pages/admin/CurriculumCRUD';
import ExamCRUD from '@/pages/admin/ExamCRUD';
import GradeList from '@/pages/admin/GradeList';
import WorkloadCRUD from '@/pages/admin/WorkloadCRUD';
import ResearchCRUD from '@/pages/admin/ResearchCRUD';
import ThesisCRUD from '@/pages/admin/ThesisCRUD';
import DocumentList from '@/pages/admin/DocumentList';
import AuditList from '@/pages/admin/AuditList';
import AuditLogViewer from '@/pages/admin/AuditLogViewer';
import ComplianceCRUD from '@/pages/admin/ComplianceCRUD';
import ReportCRUD from '@/pages/admin/ReportCRUD';
import NotificationSender from '@/pages/admin/NotificationSender';

// Faculty pages
import FacultyExams from '@/pages/faculty/FacultyExams';
import GradeSubmission from '@/pages/faculty/GradeSubmission';
import FacultyResearch from '@/pages/faculty/FacultyResearch';
import ThesisSupervision from '@/pages/faculty/ThesisSupervision';
import DocumentVerification from '@/pages/faculty/DocumentVerification';
import FacultyWorkload from '@/pages/faculty/FacultyWorkload';

// Student pages
import MyGrades from '@/pages/student/MyGrades';
import MyThesis from '@/pages/student/MyThesis';
import MyDocuments from '@/pages/student/MyDocuments';
import StudentResearch from '@/pages/student/StudentResearch';

// Dept Head pages
import DeptDepartment from '@/pages/deptHead/DeptDepartment';
import DeptFaculty from '@/pages/deptHead/DeptFaculty';
import DeptCourses from '@/pages/deptHead/DeptCourses';
import DeptCurriculum from '@/pages/deptHead/DeptCurriculum';
import DeptWorkloads from '@/pages/deptHead/DeptWorkloads';
import DeptCompliance from '@/pages/deptHead/DeptCompliance';
import DeptReports from '@/pages/deptHead/DeptReports';

// Compliance pages
import CompAudits from '@/pages/compliance/CompAudits';
import CompAuditLogs from '@/pages/compliance/CompAuditLogs';
import CompRecords from '@/pages/compliance/CompRecords';
import CompGrades from '@/pages/compliance/CompGrades';
import CompResearch from '@/pages/compliance/CompResearch';
import CompReports from '@/pages/compliance/CompReports';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                <Route path="/admin/users" element={<UserList />} />
                <Route path="/admin/students" element={<StudentCRUD />} />
                <Route path="/admin/faculties" element={<FacultyCRUD />} />
                <Route path="/admin/departments" element={<DepartmentCRUD />} />
                <Route path="/admin/courses" element={<CourseCRUD />} />
                <Route path="/admin/curriculum" element={<CurriculumCRUD />} />
                <Route path="/admin/exams" element={<ExamCRUD />} />
                <Route path="/admin/grades" element={<GradeList />} />
                <Route path="/admin/workloads" element={<WorkloadCRUD />} />
                <Route path="/admin/research" element={<ResearchCRUD />} />
                <Route path="/admin/thesis" element={<ThesisCRUD />} />
                <Route path="/admin/documents" element={<DocumentList />} />
                <Route path="/admin/audits" element={<AuditList />} />
                <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
                <Route path="/admin/compliance" element={<ComplianceCRUD />} />
                <Route path="/admin/reports" element={<ReportCRUD />} />
                <Route path="/admin/notifications" element={<NotificationSender />} />
              </Route>

              {/* Faculty routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.FACULTY]} />}>
                <Route path="/faculty/exams" element={<FacultyExams />} />
                <Route path="/faculty/grades" element={<GradeSubmission />} />
                <Route path="/faculty/research" element={<FacultyResearch />} />
                <Route path="/faculty/thesis" element={<ThesisSupervision />} />
                <Route path="/faculty/documents" element={<DocumentVerification />} />
                <Route path="/faculty/workload" element={<FacultyWorkload />} />
              </Route>

              {/* Student routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.STUDENT]} />}>
                <Route path="/student/grades" element={<MyGrades />} />
                <Route path="/student/thesis" element={<MyThesis />} />
                <Route path="/student/documents" element={<MyDocuments />} />
                <Route path="/student/research" element={<StudentResearch />} />
              </Route>

              {/* Dept Head routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.DEPARTMENT_HEAD]} />}>
                <Route path="/dept/department" element={<DeptDepartment />} />
                <Route path="/dept/faculty" element={<DeptFaculty />} />
                <Route path="/dept/courses" element={<DeptCourses />} />
                <Route path="/dept/curriculum" element={<DeptCurriculum />} />
                <Route path="/dept/workloads" element={<DeptWorkloads />} />
                <Route path="/dept/compliance" element={<DeptCompliance />} />
                <Route path="/dept/reports" element={<DeptReports />} />
              </Route>

              {/* Compliance Officer routes */}
              <Route element={<ProtectedRoute allowedRoles={[Role.COMPLIANCE_OFFICER]} />}>
                <Route path="/compliance/audits" element={<CompAudits />} />
                <Route path="/compliance/audit-logs" element={<CompAuditLogs />} />
                <Route path="/compliance/records" element={<CompRecords />} />
                <Route path="/compliance/grades" element={<CompGrades />} />
                <Route path="/compliance/research" element={<CompResearch />} />
                <Route path="/compliance/reports" element={<CompReports />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
