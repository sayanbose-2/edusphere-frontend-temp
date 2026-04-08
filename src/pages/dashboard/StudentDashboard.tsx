import { Row, Col } from 'react-bootstrap';
import { BsBarChart, BsFolder, BsFileEarmarkText, BsSearch, BsArrowRight, BsMortarboardFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const nav = [
  { label: 'My Grades',         desc: 'View exam scores and academic results', icon: <BsBarChart size={20} />,        color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   path: '/student/grades' },
  { label: 'My Thesis',         desc: 'Track thesis submissions and progress',  icon: <BsFileEarmarkText size={20} />, color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   path: '/student/thesis' },
  { label: 'Research Projects', desc: 'Browse your research involvement',       icon: <BsSearch size={20} />,          color: '#0284C7', bg: 'rgba(2,132,199,0.08)',   path: '/student/research' },
  { label: 'My Documents',      desc: 'Upload and manage academic documents',   icon: <BsFolder size={20} />,          color: '#D97706', bg: 'rgba(217,119,6,0.08)',   path: '/student/documents' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)', color: '#fff' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, opacity: 0.55, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr()}</p>
          <h2 style={{ margin: '0 0 5px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Student Portal · Academic Year 2025–26</p>
        </div>
        <BsMortarboardFill size={56} style={{ opacity: 0.08 }} />
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>Your Academics</p>

      <Row className="g-3">
        {nav.map(card => (
          <Col key={card.label} xs={12} sm={6} xl={3}>
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
