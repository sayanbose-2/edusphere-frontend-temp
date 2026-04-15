import { useEffect, useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { BsShieldCheck, BsClipboard2Check, BsFileEarmarkBarGraph, BsListUl, BsSearch, BsArrowRight } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { complianceService } from '@/services/compliance.service';
import { reportService } from '@/services/report.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function RegulatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ flagged: 0, records: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([auditService.getAll(), complianceService.getAll(), reportService.getAll()])
      .then(([a, c, r]) => {
        const audits = a.status === 'fulfilled' ? a.value : [];
        setCounts({
          flagged: audits.filter(x => x.status === 'FLAGGED').length,
          records: c.status === 'fulfilled' ? c.value.length : 0,
          reports: r.status === 'fulfilled' ? r.value.length : 0,
        });
      }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Flagged Audits',      value: counts.flagged,  icon: <BsShieldCheck size={18} />,         tw: 'bg-danger/10 text-danger',   path: '/compliance/audits' },
    { label: 'Compliance Records',  value: counts.records,  icon: <BsClipboard2Check size={18} />,     tw: 'bg-blue-dim text-blue',       path: '/compliance/records' },
    { label: 'Reports',             value: counts.reports,  icon: <BsFileEarmarkBarGraph size={18} />, tw: 'bg-success/10 text-success',  path: '/compliance/reports' },
  ];

  const quickLinks = [
    { label: 'Audits',              path: '/compliance/audits',      icon: <BsShieldCheck size={14} /> },
    { label: 'Audit Logs',          path: '/compliance/audit-logs',  icon: <BsListUl size={14} /> },
    { label: 'Research Compliance', path: '/compliance/research',    icon: <BsSearch size={14} /> },
  ];

  if (loading) {
    return <div className="flex justify-center pt-20"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="welcome-banner welcome-banner--regulator">
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">{dateStr()}</p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="m-0 text-base opacity-60">Regulator · Oversight &amp; monitoring</p>
        </div>
        <BsShieldCheck size={56} className="opacity-8" />
      </div>

      <Row className="g-3 mb-4">
        {stats.map(s => (
          <Col key={s.label} xs={12} md={4}>
            <div className="feature-card" onClick={() => navigate(s.path)}>
              <div className="flex justify-between items-start mb-3.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.tw}`}>{s.icon}</div>
                <span className="text-7xl font-black text-base tracking-tight leading-none">{s.value}</span>
              </div>
              <h6 className="m-0 font-bold text-base text-base mb-3.5">{s.label}</h6>
              <div className={`flex items-center gap-1 text-sm font-semibold ${s.tw.split(' ').find(c => c.startsWith('text-'))}`}>
                View <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-var-sm">
        <div className="py-3 px-4.5 border-b border-border bg-subtle">
          <span className="text-base font-semibold text-base">Quick Access</span>
        </div>
        {quickLinks.map((link, i) => (
          <div
            key={link.label}
            onClick={() => navigate(link.path)}
            className={`flex items-center justify-between py-3.25 px-4.5 cursor-pointer transition-colors hover:bg-base ${i < quickLinks.length - 1 ? 'border-b border-border' : ''}`}
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
