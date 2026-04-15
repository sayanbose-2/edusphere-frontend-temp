import { useEffect, useState } from 'react';
import { Row, Col, Spinner, Table } from 'react-bootstrap';
import { BsPeople, BsMortarboard, BsPersonBadge, BsBuilding, BsBook, BsClipboardCheck, BsShieldCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { courseService } from '@/services/course.service';
import { departmentService } from '@/services/department.service';
import { examService } from '@/services/exam.service';
import { facultyService } from '@/services/faculty.service';
import { studentService } from '@/services/student.service';
import { userService } from '@/services/user.service';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Audit } from '@/types/compliance.types';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ users: 0, students: 0, faculty: 0, departments: 0, courses: 0, exams: 0 });
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      userService.getAll(), studentService.getAll(), facultyService.getAll(),
      departmentService.getAll(), courseService.getAll(), examService.getAll(),
      auditService.getAll(),
    ]).then(([u, s, f, d, c, e, a]) => {
      setCounts({
        users:       u.status === 'fulfilled' ? u.value.length : 0,
        students:    s.status === 'fulfilled' ? s.value.length : 0,
        faculty:     f.status === 'fulfilled' ? f.value.length : 0,
        departments: d.status === 'fulfilled' ? d.value.length : 0,
        courses:     c.status === 'fulfilled' ? c.value.length : 0,
        exams:       e.status === 'fulfilled' ? e.value.length : 0,
      });
      setAudits(a.status === 'fulfilled' ? a.value.slice(0, 6) : []);
    }).catch(() => {
      toast.error('Failed to load dashboard');
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Users',       value: counts.users,       icon: <BsPeople size={18} />,         tw: 'bg-blue-dim text-blue' },
    { label: 'Students',    value: counts.students,    icon: <BsMortarboard size={18} />,    tw: 'bg-success/10 text-success' },
    { label: 'Faculty',     value: counts.faculty,     icon: <BsPersonBadge size={18} />,    tw: 'bg-info/10 text-info' },
    { label: 'Departments', value: counts.departments, icon: <BsBuilding size={18} />,       tw: 'bg-purple-100/60 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { label: 'Courses',     value: counts.courses,     icon: <BsBook size={18} />,           tw: 'bg-warning/10 text-warning' },
    { label: 'Exams',       value: counts.exams,       icon: <BsClipboardCheck size={18} />, tw: 'bg-danger/10 text-danger' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      {/* Welcome */}
      <div className="welcome-banner welcome-banner--admin">
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">{dateStr()}</p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="m-0 text-base opacity-60">Administrator · Here's your institution at a glance</p>
        </div>
        <BsShieldCheck size={56} className="opacity-8" />
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {stats.map(s => (
          <Col key={s.label} xs={6} md={4} lg={2}>
            <div className="bg-surface border border-border rounded-lg p-4 shadow-var-sm">
              <div className={`w-34 h-34 rounded-lg mb-2.5 flex items-center justify-center ${s.tw}`}>
                {s.icon}
              </div>
              <div className="text-3xl font-black text-base tracking-tight leading-none">{s.value}</div>
              <div className="text-sm text-secondary mt-1">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Recent Audits */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-var-sm">
        <div className="flex justify-between items-center py-3.25 px-4.5 border-b border-border bg-subtle">
          <span className="text-base font-semibold text-base">Recent Audits</span>
          <span className="text-xs text-tertiary">Last {audits.length} records</span>
        </div>
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Entity</th><th>Scope</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {audits.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-tertiary text-base">No audits recorded yet</td></tr>
            ) : audits.map(a => (
              <tr key={a.id}>
                <td>{a.entityType}</td>
                <td>{a.scope}</td>
                <td className="text-secondary">{new Date(a.auditDate).toLocaleDateString()}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
