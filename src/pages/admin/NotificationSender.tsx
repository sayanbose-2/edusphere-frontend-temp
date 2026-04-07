import { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { notificationService } from '@/services/notification.service';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { Role } from '@/types/enums';
import type { User } from '@/types/academic.types';
import { NotificationType } from '@/types/enums';

type TargetType = 'user' | 'role' | 'all';

export default function NotificationSender() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>(NotificationType.ENROLLMENT);
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>('STUDENT');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsers(await userService.getAll());
      } catch {
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    if (!category.trim()) { toast.error('Category is required'); return; }
    if (targetType === 'user' && !userId) { toast.error('Please select a user'); return; }

    try {
      setSending(true);
      switch (targetType) {
        case 'user':
          await notificationService.sendToUser(userId, { userId, entityId: userId, message, category: category as NotificationType, isRead: false });
          toast.success('Notification sent to user');
          break;
        case 'role':
          await notificationService.sendToRole(role, { message, category: category as NotificationType });
          toast.success(`Notification sent to all ${role}s`);
          break;
        case 'all':
          await notificationService.broadcast({ message, category: category as NotificationType });
          toast.success('Notification broadcast to all users');
          break;
      }
      setMessage('');
      setCategory(NotificationType.ENROLLMENT);
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const roles: Role[] = ['STUDENT' as Role, 'FACULTY' as Role, 'ADMIN' as Role, 'DEPARTMENT_HEAD' as Role, 'COMPLIANCE_OFFICER' as Role, 'REGULATOR' as Role];

  return (
    <div>
      <PageHeader
        title="Send Notifications"
        subtitle="Send notifications to users, roles, or broadcast to all"
      />

      <Card>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Target Type</Form.Label>
              <Form.Select value={targetType} onChange={(e) => setTargetType(e.target.value as TargetType)}>
                <option value="all">Broadcast to All</option>
                <option value="user">Specific User</option>
                <option value="role">By Role</option>
              </Form.Select>
            </Form.Group>

            {targetType === 'user' && (
              <Form.Group className="mb-3">
                <Form.Label>Select User</Form.Label>
                <Form.Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {targetType === 'role' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Role</Form.Label>
                <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.values(NotificationType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message..."
              />
            </Form.Group>

            <Button variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
