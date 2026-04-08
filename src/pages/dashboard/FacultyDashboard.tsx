import { useEffect, useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { BsClipboardCheck, BsSearch, BsBriefcase, BsFileEarmarkText, BsFolder, BsArrowRight, BsPersonBadge } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { examService } from '@/services/exam.service';
import { researchService } from '@/services/research.service';
import { workloadService } from '@/services/workload.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ exams: 0, research: 0, workloads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([examService.getAll(), researchService.getAll(), workloadService.getAll()])
      .then(([e, r, w]) => {
        setCounts({
          exams:     e.status === 'fulfilled' ? e.value.length : 0,
          research:  r.status === 'fulfilled' ? r.value.length : 0,
          workloads: w.status === 'fulfilled' ? w.value.length : 0,
        });
      }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Exams',    value: counts.exams,     icon: <BsClipboardCheck size={18} />, color: '#2563EB', bg: 'rgba(37,99,235,0.08)',  path: '/faculty/exams',    sub: 'Active exams' },
    { label: 'Research', value: counts.research,  icon: <BsSearch size={18} />,          color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   path: '/faculty/research', sub: 'Research projects' },
    { label: 'Workload', value: counts.workloads, icon: <BsBriefcase size={18} />,        color: '#D97706', bg: 'rgba(217,119,6,0.08)',   path: '/faculty/workload', sub: 'Assigned workloads' },
  ];

  const quickLinks = [
    { label: 'Grade Submissions', path: '/faculty/grades',    icon: <BsClipboardCheck size={14} /> },
    { label: 'Thesis Supervision', path: '/faculty/thesis',   icon: <BsFileEarmarkText size={14} /> },
    { label: 'Documents',          path: '/faculty/documents', icon: <BsFolder size={14} /> },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 60%, #4F46E5 100%)', color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, opacity: 0.55, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr()}</p>
          <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Faculty Portal · Academic Year 2025–26</p>
        </div>
        <BsPersonBadge size={56} style={{ opacity: 0.08 }} />
      </div>

      <Row className="g-3 mb-4">
        {statCards.map(c => (
          <Col key={c.label} xs={12} md={4}>
            <div className="feature-card" onClick={() => navigate(c.path)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</div>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.8px', lineHeight: 1 }}>{c.value}</span>
              </div>
              <h6 style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{c.label}</h6>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-2)' }}>{c.sub}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.color, fontWeight: 600 }}>
                View <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Quick links */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Quick Access</span>
        </div>
        {quickLinks.map((link, i) => (
          <div
            key={link.label}
            onClick={() => navigate(link.path)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < quickLinks.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              <span style={{ color: 'var(--text-2)' }}>{link.icon}</span>
              {link.label}
            </div>
            <BsArrowRight size={12} style={{ color: 'var(--text-3)' }} />
          </div>
        ))}
      </div>
    </>
  );
}
