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
    { label: 'Users',       value: counts.users,       icon: <BsPeople size={18} />,        color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
    { label: 'Students',    value: counts.students,    icon: <BsMortarboard size={18} />,   color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
    { label: 'Faculty',     value: counts.faculty,     icon: <BsPersonBadge size={18} />,   color: '#0284C7', bg: 'rgba(2,132,199,0.08)' },
    { label: 'Departments', value: counts.departments, icon: <BsBuilding size={18} />,      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    { label: 'Courses',     value: counts.courses,     icon: <BsBook size={18} />,          color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Exams',       value: counts.exams,       icon: <BsClipboardCheck size={18} />, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      {/* Welcome */}
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)', color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, opacity: 0.55, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr()}</p>
          <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Administrator · Here's your institution at a glance</p>
        </div>
        <BsShieldCheck size={56} style={{ opacity: 0.08 }} />
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {stats.map(s => (
          <Col key={s.label} xs={6} md={4} lg={2}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: 10 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Recent Audits */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Recent Audits</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Last {audits.length} records</span>
        </div>
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Entity</th><th>Scope</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {audits.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No audits recorded yet</td></tr>
            ) : audits.map(a => (
              <tr key={a.id}>
                <td>{a.entityType}</td>
                <td>{a.scope}</td>
                <td style={{ color: 'var(--text-2)' }}>{new Date(a.auditDate).toLocaleDateString()}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
