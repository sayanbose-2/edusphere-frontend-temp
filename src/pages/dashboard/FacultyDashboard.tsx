import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { BsClipboardCheck, BsSearch, BsBriefcase } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { examService } from '@/services/exam.service';
import { researchService } from '@/services/research.service';
import { workloadService } from '@/services/workload.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';

interface FacultyStats {
  exams: number;
  researchProjects: number;
  workloads: number;
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyStats>({
    exams: 0,
    researchProjects: 0,
    workloads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, researchRes, workloadRes] = await Promise.allSettled([
            examService.getAll(),
            researchService.getAll(),
            workloadService.getAll(),
          ]);

          const exams = examsRes.status === 'fulfilled' ? examsRes.value : [];
          const research = researchRes.status === 'fulfilled' ? researchRes.value : [];
          const workloads = workloadRes.status === 'fulfilled' ? workloadRes.value : [];

        setStats({
          exams: exams.length,
          researchProjects: research.length,
          workloads: workloads.length,
        });
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'My Exams', value: stats.exams, icon: <BsClipboardCheck size={28} />, color: 'primary' },
    { label: 'My Research Projects', value: stats.researchProjects, icon: <BsSearch size={28} />, color: 'success' },
    { label: 'My Workload', value: stats.workloads, icon: <BsBriefcase size={28} />, color: 'info' },
  ];

  return (
    <>
      <PageHeader title="Faculty Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <Row className="g-3 mb-4">
        {statCards.map((card) => (
          <Col key={card.label} xs={12} sm={6} md={4}>
            <Card className="stat-card h-100">
              <Card.Body className="text-center">
                <div className={`text-${card.color} mb-2`}>{card.icon}</div>
                <h3 className="fw-bold mb-1">{card.value}</h3>
                <small style={{ color: 'var(--text-secondary)' }}>{card.label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
