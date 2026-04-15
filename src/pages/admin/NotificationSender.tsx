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
      className={`px-4 py-1.5 rounded text-sm font-semibold cursor-pointer border transition-colors ${
        target === val
          ? 'bg-blue-dim border-blue text-blue'
          : 'bg-transparent border-border text-secondary'
      }`}
    >{label}</button>
  );

  return (
    <>
      <PageHeader title="Send Notifications" subtitle="Broadcast messages to users, roles, or everyone" />
      <div className="bg-surface border border-border rounded-lg p-7 max-w-xl shadow-var-sm">
        <div className="mb-5">
          <label className="form-label">Target audience</label>
          <div className="flex gap-2">
            {tgtBtn('all',  'Broadcast All')}
            {tgtBtn('user', 'Specific User')}
            {tgtBtn('role', 'By Role')}
          </div>
        </div>

        {target === 'user' && (
          <div className="mb-4">
            <label className="form-label">Select User</label>
            <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Select a user</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          </div>
        )}

        {target === 'role' && (
          <div className="mb-4">
            <label className="form-label">Select Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              {Object.values(Role).map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            {Object.values(NotificationType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter notification message…" />
        </div>

        <button className="btn btn-primary font-semibold py-2 px-6" onClick={handleSend} disabled={sending}>
          {sending && <span className="spinner-border spinner-border-sm me-2" />}
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </div>
    </>
  );
}
