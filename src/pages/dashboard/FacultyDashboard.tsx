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
    { label: 'Exams',    value: counts.exams,     icon: <BsClipboardCheck size={18} />, tw: 'bg-blue-dim text-blue',       path: '/faculty/exams',    sub: 'Active exams' },
    { label: 'Research', value: counts.research,  icon: <BsSearch size={18} />,           tw: 'bg-success/10 text-success',  path: '/faculty/research', sub: 'Research projects' },
    { label: 'Workload', value: counts.workloads, icon: <BsBriefcase size={18} />,         tw: 'bg-warning/10 text-warning',  path: '/faculty/workload', sub: 'Assigned workloads' },
  ];

  const quickLinks = [
    { label: 'Grade Submissions', path: '/faculty/grades',    icon: <BsClipboardCheck size={14} /> },
    { label: 'Thesis Supervision', path: '/faculty/thesis',   icon: <BsFileEarmarkText size={14} /> },
    { label: 'Documents',          path: '/faculty/documents', icon: <BsFolder size={14} /> },
  ];

  if (loading) {
    return <div className="flex justify-center pt-20"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="welcome-banner welcome-banner--faculty">
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">{dateStr()}</p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="m-0 text-base opacity-60">Faculty Portal · Academic Year 2025–26</p>
        </div>
        <BsPersonBadge size={56} className="opacity-8" />
      </div>

      <Row className="g-3 mb-4">
        {statCards.map(c => (
          <Col key={c.label} xs={12} md={4}>
            <div className="feature-card" onClick={() => navigate(c.path)}>
              <div className="flex justify-between items-start mb-3.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tw}`}>{c.icon}</div>
                <span className="text-7xl font-black text-base tracking-tight leading-none">{c.value}</span>
              </div>
              <h6 className="m-0 font-bold text-base text-base mb-0.5">{c.label}</h6>
              <p className="m-0 text-sm text-secondary mb-3.5">{c.sub}</p>
              <div className={`flex items-center gap-1.25 text-sm font-semibold ${c.tw.split(' ').find(cls => cls.startsWith('text-'))}`}>
                View <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Quick links */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-var-sm">
        <div className="py-3 px-4.5 border-b border-border bg-subtle">
          <span className="text-base font-semibold text-base">Quick Access</span>
        </div>
        {quickLinks.map((link, i) => (
          <div
            key={link.label}
            onClick={() => navigate(link.path)}
            className={`flex items-center justify-between py-3.25 px-4.5 border-b cursor-pointer transition-colors hover:bg-base ${i === quickLinks.length - 1 ? 'border-b-0' : 'border-border'}`}
          >
            <div className="flex items-center gap-2.5 text-base font-medium text-base">
              <span className="text-secondary">{link.icon}</span>
              {link.label}
            </div>
            <BsArrowRight size={12} className="text-tertiary" />
          </div>
        ))}
      </div>
    </>
  );
}
