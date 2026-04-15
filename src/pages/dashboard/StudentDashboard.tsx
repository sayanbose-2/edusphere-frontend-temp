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
  { label: 'My Grades',         desc: 'View exam scores and academic results', icon: <BsBarChart size={20} />,        tw: 'bg-blue-dim text-blue',       path: '/student/grades' },
  { label: 'My Thesis',         desc: 'Track thesis submissions and progress',  icon: <BsFileEarmarkText size={20} />, tw: 'bg-success/10 text-success',  path: '/student/thesis' },
  { label: 'Research Projects', desc: 'Browse your research involvement',       icon: <BsSearch size={20} />,          tw: 'bg-info/10 text-info',        path: '/student/research' },
  { label: 'My Documents',      desc: 'Upload and manage academic documents',   icon: <BsFolder size={20} />,          tw: 'bg-warning/10 text-warning',  path: '/student/documents' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="welcome-banner welcome-banner--student">
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">{dateStr()}</p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="m-0 text-base opacity-60">Student Portal · Academic Year 2025–26</p>
        </div>
        <BsMortarboardFill size={56} className="opacity-8" />
      </div>

      <p className="text-xs font-bold text-tertiary mb-3.5 uppercase tracking-wider">Your Academics</p>

      <Row className="g-3">
        {nav.map(card => (
          <Col key={card.label} xs={12} sm={6} xl={3}>
            <div className="feature-card" onClick={() => navigate(card.path)}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3.5 ${card.tw}`}>
                {card.icon}
              </div>
              <h6 className="m-0 font-bold text-base text-base mb-1">{card.label}</h6>
              <p className="m-0 text-sm text-secondary leading-relaxed mb-4">{card.desc}</p>
              <div className={`flex items-center gap-1 text-sm font-semibold ${card.tw.split(' ').find(c => c.startsWith('text-'))}`}>
                Open <BsArrowRight size={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </>
  );
}
