import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Table } from 'react-bootstrap';
import {
  BsPeople,
  BsMortarboard,
  BsPersonBadge,
  BsBuilding,
  BsBook,
  BsClipboardCheck,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { courseService } from '@/services/course.service';
import { departmentService } from '@/services/department.service';
import { examService } from '@/services/exam.service';
import { facultyService } from '@/services/faculty.service';
import { studentService } from '@/services/student.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Audit } from '@/types/compliance.types';

interface DashboardStats {
  users: number;
  students: number;
  faculties: number;
  departments: number;
  courses: number;
  exams: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    students: 0,
    faculties: 0,
    departments: 0,
    courses: 0,
    exams: 0,
  });
  const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, studentsRes, facultiesRes, departmentsRes, coursesRes, examsRes, auditsRes] =
          await Promise.allSettled([
            userService.getAll(),
            studentService.getAll(),
            facultyService.getAll(),
            departmentService.getAll(),
            courseService.getAll(),
            examService.getAll(),
            auditService.getAll(),
          ]);

        const users = usersRes.status === 'fulfilled' ? usersRes.value : [];
        const students = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
        const faculties = facultiesRes.status === 'fulfilled' ? facultiesRes.value : [];
        const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value : [];
        const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : [];
        const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];
        const audits = auditsRes.status === 'fulfilled' ? auditsRes.value : [];

        setStats({
          users: users.length,
          students: students.length,
          faculties: faculties.length,
          departments: departments.length,
          courses: courses.length,
          exams: exams.length,
        });

        setRecentAudits(audits.slice(0, 5));
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: <BsPeople size={28} />, color: 'primary' },
    { label: 'Students', value: stats.students, icon: <BsMortarboard size={28} />, color: 'success' },
    { label: 'Faculty', value: stats.faculties, icon: <BsPersonBadge size={28} />, color: 'info' },
    { label: 'Departments', value: stats.departments, icon: <BsBuilding size={28} />, color: 'warning' },
    { label: 'Courses', value: stats.courses, icon: <BsBook size={28} />, color: 'danger' },
    { label: 'Exams', value: stats.exams, icon: <BsClipboardCheck size={28} />, color: 'secondary' },
  ];

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <Row className="g-3 mb-4">
        {statCards.map((card) => (
          <Col key={card.label} xs={12} sm={6} md={4} lg={2}>
            <Card className="stat-card h-100">
              <Card.Body className="text-center">
                <div className={`text-${card.color} mb-2`}>{card.icon}</div>
                <h3 className="fw-bold mb-1">{card.value}</h3>
                <small style={{ color: 'var(--text-secondary)' }}>{card.label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header className="fw-semibold" style={{ fontSize: '0.88rem' }}>Recent Audits</Card.Header>
        <Card.Body className="p-0">
          <div className="table-wrap mb-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Entity Type</th>
                <th>Scope</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-3" style={{ color: 'var(--text-secondary)' }}>
                    No recent audits
                  </td>
                </tr>
              ) : (
                recentAudits.map((audit) => (
                  <tr key={audit.auditId}>
                    <td>{audit.entityType}</td>
                    <td>{audit.scope}</td>
                    <td>{new Date(audit.auditDate).toLocaleDateString()}</td>
                    <td><StatusBadge status={audit.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
