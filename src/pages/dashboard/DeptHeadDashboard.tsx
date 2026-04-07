import { Card, Row, Col } from 'react-bootstrap';
import { BsPersonBadge, BsBook, BsBriefcase, BsBuilding } from 'react-icons/bs';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DeptHeadDashboard() {
  const { user } = useAuth();

  const statCards = [
    {
      label: 'My Department',
      description: 'View department details',
      icon: <BsBuilding size={28} />,
      color: 'primary',
      link: '/dept/department',
    },
    {
      label: 'Faculty',
      description: 'Manage department faculty',
      icon: <BsPersonBadge size={28} />,
      color: 'success',
      link: '/dept/faculty',
    },
    {
      label: 'Courses',
      description: 'View department courses',
      icon: <BsBook size={28} />,
      color: 'info',
      link: '/dept/courses',
    },
    {
      label: 'Workloads',
      description: 'Manage faculty workloads',
      icon: <BsBriefcase size={28} />,
      color: 'warning',
      link: '/dept/workloads',
    },
  ];

  return (
    <>
      <PageHeader title="Department Head Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <Row className="g-3 mb-4">
        {statCards.map((card) => (
          <Col key={card.label} xs={12} sm={6} md={3}>
            <Card className="stat-card h-100">
              <Card.Body className="text-center">
                <div className={`text-${card.color} mb-2`}>{card.icon}</div>
                <h5 className="fw-bold mb-1">{card.label}</h5>
                <small style={{ color: 'var(--text-secondary)' }}>{card.description}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
