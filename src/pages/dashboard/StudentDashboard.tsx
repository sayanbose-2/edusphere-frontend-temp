import { Card, Row, Col } from 'react-bootstrap';
import { BsBarChart, BsFolder, BsFileEarmarkText, BsSearch, BsArrowRight } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const statCards = [
    {
      label: 'My Grades',
      description: 'View your exam scores and results',
      icon: <BsBarChart size={26} />,
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.1)',
      link: '/student/grades',
    },
    {
      label: 'My Thesis',
      description: 'Track your thesis submissions',
      icon: <BsFileEarmarkText size={26} />,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.1)',
      link: '/student/thesis',
    },
    {
      label: 'Research Projects',
      description: 'Browse your research involvement',
      icon: <BsSearch size={26} />,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.1)',
      link: '/student/research',
    },
    {
      label: 'My Documents',
      description: 'Manage your uploaded documents',
      icon: <BsFolder size={26} />,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.1)',
      link: '/student/documents',
    },
  ];

  return (
    <>
      <PageHeader
        title="Student Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
      />

      <Row className="g-3">
        {statCards.map((card) => (
          <Col key={card.label} xs={12} sm={6} xl={3}>
            <Card
              className="stat-card h-100"
              onClick={() => navigate(card.link)}
            >
              <Card.Body className="p-4">
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                    marginBottom: 14,
                  }}
                >
                  {card.icon}
                </div>
                <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {card.label}
                </h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.775rem', margin: '0 0 14px' }}>
                  {card.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.775rem', color: card.color }}>
                  Go to {card.label} <BsArrowRight size={12} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
