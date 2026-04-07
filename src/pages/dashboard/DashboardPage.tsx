import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enums';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import FacultyDashboard from '@/pages/dashboard/FacultyDashboard';
import StudentDashboard from '@/pages/dashboard/StudentDashboard';
import DeptHeadDashboard from '@/pages/dashboard/DeptHeadDashboard';
import ComplianceDashboard from '@/pages/dashboard/ComplianceDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.roles.includes(Role.ADMIN)) return <AdminDashboard />;
  if (user.roles.includes(Role.DEPARTMENT_HEAD)) return <DeptHeadDashboard />;
  if (user.roles.includes(Role.FACULTY)) return <FacultyDashboard />;
  if (user.roles.includes(Role.COMPLIANCE_OFFICER)) return <ComplianceDashboard />;
  if (user.roles.includes(Role.STUDENT)) return <StudentDashboard />;

  return (
    <div>
      <h4>Welcome, {user.name}</h4>
      <p className="text-muted">Role: {user.roles.join(', ')}</p>
    </div>
  );
}
