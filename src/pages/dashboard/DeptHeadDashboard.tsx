import { Row, Col } from 'react-bootstrap';
import { BsPersonBadge, BsBook, BsBriefcase, BsBuilding, BsArrowRight, BsClipboard2Check, BsFileEarmarkBarGraph, BsJournalText } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const sections = [
  { label: 'My Department',  desc: 'Department details and profile',     icon: <BsBuilding size={18} />,            color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   path: '/dept/department' },
  { label: 'Faculty',        desc: 'Manage department faculty members',  icon: <BsPersonBadge size={18} />,         color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   path: '/dept/faculty' },
  { label: 'Courses',        desc: 'Oversee department courses',         icon: <BsBook size={18} />,                color: '#0284C7', bg: 'rgba(2,132,199,0.08)',   path: '/dept/courses' },
  { label: 'Curriculum',     desc: 'Review curriculum structure',        icon: <BsJournalText size={18} />,         color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  path: '/dept/curriculum' },
  { label: 'Workloads',      desc: 'Review and assign faculty workload', icon: <BsBriefcase size={18} />,           color: '#D97706', bg: 'rgba(217,119,6,0.08)',   path: '/dept/workloads' },
  { label: 'Compliance',     desc: 'Monitor compliance status',          icon: <BsClipboard2Check size={18} />,     color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   path: '/dept/compliance' },
  { label: 'Reports',        desc: 'Generate and view reports',          icon: <BsFileEarmarkBarGraph size={18} />, color: '#64748B', bg: 'rgba(100,116,139,0.08)', path: '/dept/reports' },
];

export default function DeptHeadDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #4A044E 0%, #86198F 60%, #A21CAF 100%)', color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, opacity: 0.55, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr()}</p>
          <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Department Head · Manage your department</p>
        </div>
        <BsBuilding size={56} style={{ opacity: 0.08 }} />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>Department Management</p>

      <Row className="g-3">
        {sections.map(card => (
          <Col key={card.label} xs={12} sm={6} lg={4} xl={3}>
            <div className="feature-card" onClick={() => navigate(card.path)}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: 14 }}>
                {card.icon}
              </div>
              <h6 style={{ margin: '0 0 5px', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{card.label}</h6>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{card.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: card.color, fontWeight: 600 }}>
                Open <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </>
  );
}
