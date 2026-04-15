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
    { label: 'Flagged Audits',      value: counts.flagged,  icon: <BsShieldCheck size={18} />,         color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   path: '/compliance/audits' },
    { label: 'Compliance Records',  value: counts.records,  icon: <BsClipboard2Check size={18} />,     color: '#2563EB', bg: 'rgba(37,99,235,0.08)',    path: '/compliance/records' },
    { label: 'Reports',             value: counts.reports,  icon: <BsFileEarmarkBarGraph size={18} />, color: '#16A34A', bg: 'rgba(22,163,74,0.08)',    path: '/compliance/reports' },
  ];

  const quickLinks = [
    { label: 'Audits',              path: '/compliance/audits',      icon: <BsShieldCheck size={14} /> },
    { label: 'Audit Logs',          path: '/compliance/audit-logs',  icon: <BsListUl size={14} /> },
    { label: 'Research Compliance', path: '/compliance/research',    icon: <BsSearch size={14} /> },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner animation="border" /></div>;
  }

  return (
    <>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2E5B8E 60%, #3A72B0 100%)', color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, opacity: 0.55, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr()}</p>
          <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Regulator · Oversight &amp; monitoring</p>
        </div>
        <BsShieldCheck size={56} style={{ opacity: 0.08 }} />
      </div>

      <Row className="g-3 mb-4">
        {stats.map(s => (
          <Col key={s.label} xs={12} md={4}>
            <div className="feature-card" onClick={() => navigate(s.path)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.8px', lineHeight: 1 }}>{s.value}</span>
              </div>
              <h6 style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{s.label}</h6>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: s.color, fontWeight: 600 }}>
                View <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

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
