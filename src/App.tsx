import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import ProfileSetupPage from '@/pages/auth/ProfileSetupPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { Role } from '@/types/enums';

import UserPage from '@/pages/people/UserPage';
import StudentPage from '@/pages/people/StudentPage';
import FacultyPage from '@/pages/people/FacultyPage';
import DepartmentPage from '@/pages/people/DepartmentPage';
import CoursePage from '@/pages/academic/CoursePage';
import CurriculumPage from '@/pages/academic/CurriculumPage';
import ExamPage from '@/pages/academic/ExamPage';
import GradePage from '@/pages/academic/GradePage';
import WorkloadPage from '@/pages/academic/WorkloadPage';
import ResearchPage from '@/pages/research/ResearchPage';
import ThesisPage from '@/pages/research/ThesisPage';
import DocumentsPage from '@/pages/research/DocumentsPage';
import AuditPage from '@/pages/compliance/AuditPage';
import CompliancePage from '@/pages/compliance/CompliancePage';
import ReportPage from '@/pages/compliance/ReportPage';
import NotificationPage from '@/pages/admin/NotificationPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <Navigate to="/login" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/profile/setup', element: <ProfileSetupPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/change-password', element: <ChangePasswordPage /> },

          // admin-only
          {
            element: <ProtectedRoute allowedRoles={[Role.ADMIN]} />,
            children: [
              { path: '/users', element: <UserPage /> },
              { path: '/notifications', element: <NotificationPage /> },
            ],
          },

          // admin + dept head
          {
            element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.DEPARTMENT_HEAD]} />,
            children: [
              { path: '/students', element: <StudentPage /> },
              { path: '/faculty', element: <FacultyPage /> },
              { path: '/departments', element: <DepartmentPage /> },
              { path: '/courses', element: <CoursePage /> },
              { path: '/curriculum', element: <CurriculumPage /> },
              { path: '/workloads', element: <WorkloadPage /> },
            ],
          },

          // academic — most roles
          {
            element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.FACULTY, Role.DEPARTMENT_HEAD, Role.STUDENT, Role.COMPLIANCE_OFFICER, Role.REGULATOR]} />,
            children: [
              { path: '/exams', element: <ExamPage /> },
              { path: '/grades', element: <GradePage /> },
            ],
          },

          // research
          {
            element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.FACULTY, Role.STUDENT]} />,
            children: [
              { path: '/research', element: <ResearchPage /> },
              { path: '/thesis', element: <ThesisPage /> },
              { path: '/documents', element: <DocumentsPage /> },
            ],
          },

          // compliance
          {
            element: <ProtectedRoute allowedRoles={[Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.REGULATOR, Role.DEPARTMENT_HEAD]} />,
            children: [
              { path: '/compliance', element: <CompliancePage /> },
              { path: '/reports', element: <ReportPage /> },
              { path: '/audits', element: <AuditPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
