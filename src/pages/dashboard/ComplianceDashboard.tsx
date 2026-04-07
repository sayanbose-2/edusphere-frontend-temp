import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { BsShieldCheck, BsClipboard2Check, BsFileEarmarkBarGraph } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { complianceService } from '@/services/compliance.service';
import { reportService } from '@/services/report.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';

interface ComplianceStats {
  pendingAudits: number;
  complianceRecords: number;
  reports: number;
}

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ComplianceStats>({
    pendingAudits: 0,
    complianceRecords: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [audits, complianceRecords, reports] = await Promise.all([
            auditService.getAll(),
            complianceService.getAll(),
            reportService.getAll(),
          ]);

          const pendingAudits = audits.filter((a) => a.status === 'PENDING').length;

          setStats({
            pendingAudits,
            complianceRecords: complianceRecords.length,
            reports: reports.length,
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
    { label: 'Pending Audits', value: stats.pendingAudits, icon: <BsShieldCheck size={28} />, color: 'warning' },
    { label: 'Compliance Records', value: stats.complianceRecords, icon: <BsClipboard2Check size={28} />, color: 'primary' },
    { label: 'Reports', value: stats.reports, icon: <BsFileEarmarkBarGraph size={28} />, color: 'info' },
  ];

  return (
    <>
      <PageHeader title="Compliance Dashboard" subtitle={`Welcome back, ${user?.name}`} />

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
