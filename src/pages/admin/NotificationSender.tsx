import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { notificationService } from '@/services/notification.service';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { NotificationType, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { User } from '@/types/academic.types';

type Target = 'all' | 'user' | 'role';

export default function NotificationSender() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>(NotificationType.ENROLLMENT);
  const [target, setTarget] = useState<Target>('all');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>(Role.STUDENT);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    userService.getAll().then(setUsers).catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load users');
    });
  }, []);

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Message is required'); return; }
    if (target === 'user' && !userId) { toast.error('Select a user'); return; }
    setSending(true);
    try {
      if (target === 'user') {
        await notificationService.sendToUser(userId, { userId, entityId: userId, message, category: category as NotificationType, isRead: false });
        toast.success('Notification sent to user');
      } else if (target === 'role') {
        await notificationService.sendToRole(role, { message, category: category as NotificationType });
        toast.success(`Sent to all ${formatEnum(role)}s`);
      } else {
        await notificationService.broadcast({ message, category: category as NotificationType });
        toast.success('Broadcast sent to all users');
      }
      setMessage('');
    } catch { toast.error('Failed to send notification'); }
    finally { setSending(false); }
  };

  const tgtBtn = (val: Target, label: string) => (
    <button
      key={val}
      onClick={() => setTarget(val)}
      style={{
        padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${target === val ? 'var(--blue)' : 'var(--border)'}`,
        background: target === val ? 'var(--blue-dim)' : 'transparent',
        color: target === val ? 'var(--blue)' : 'var(--text-2)',
      }}
    >{label}</button>
  );

  return (
    <>
      <PageHeader title="Send Notifications" subtitle="Broadcast messages to users, roles, or everyone" />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '28px 32px', maxWidth: 560, boxShadow: 'var(--shadow)' }}>
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Target audience</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {tgtBtn('all',  'Broadcast All')}
            {tgtBtn('user', 'Specific User')}
            {tgtBtn('role', 'By Role')}
          </div>
        </div>

        {target === 'user' && (
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Select User</label>
            <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Select a user</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          </div>
        )}

        {target === 'role' && (
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Select Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              {Object.values(Role).map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            {Object.values(NotificationType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter notification message…" />
        </div>

        <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ fontWeight: 600, padding: '9px 24px' }}>
          {sending && <span className="spinner-border spinner-border-sm me-2" />}
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </div>
    </>
  );
}
