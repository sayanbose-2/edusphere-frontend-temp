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
  { label: 'My Department',  desc: 'Department details and profile',     icon: <BsBuilding size={18} />,            tw: 'bg-blue-dim text-blue',         path: '/dept/department' },
  { label: 'Faculty',        desc: 'Manage department faculty members',  icon: <BsPersonBadge size={18} />,         tw: 'bg-success/10 text-success',    path: '/dept/faculty' },
  { label: 'Courses',        desc: 'Oversee department courses',         icon: <BsBook size={18} />,                tw: 'bg-info/10 text-info',          path: '/dept/courses' },
  { label: 'Curriculum',     desc: 'Review curriculum structure',        icon: <BsJournalText size={18} />,         tw: 'bg-purple-100/60 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', path: '/dept/curriculum' },
  { label: 'Workloads',      desc: 'Review and assign faculty workload', icon: <BsBriefcase size={18} />,           tw: 'bg-warning/10 text-warning',    path: '/dept/workloads' },
  { label: 'Compliance',     desc: 'Monitor compliance status',          icon: <BsClipboard2Check size={18} />,     tw: 'bg-danger/10 text-danger',      path: '/dept/compliance' },
  { label: 'Reports',        desc: 'Generate and view reports',          icon: <BsFileEarmarkBarGraph size={18} />, tw: 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400', path: '/dept/reports' },
];

export default function DeptHeadDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="welcome-banner welcome-banner--dept-head">
        <div className="relative z-10">
          <p className="m-0 text-xs opacity-55 tracking-wide uppercase">{dateStr()}</p>
          <h2 className="m-0 text-3xl font-black tracking-tight -ml-0.5">
            {greet()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="m-0 text-base opacity-60">Department Head · Manage your department</p>
        </div>
        <BsBuilding size={56} className="opacity-8" />
      </div>

      <p className="text-xs font-bold text-tertiary mb-3.5 uppercase tracking-wider">Department Management</p>

      <Row className="g-3">
        {sections.map(card => (
          <Col key={card.label} xs={12} sm={6} lg={4} xl={3}>
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
