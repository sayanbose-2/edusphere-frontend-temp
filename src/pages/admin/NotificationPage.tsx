import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationType, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { IUser, IPageResponse } from '@/types/academicTypes';

type TTarget = 'all' | 'user' | 'role';

const EMPTY_FORM = {
  message: '',
  category: NotificationType.ENROLLMENT as string,
  target: 'all' as TTarget,
  userId: '',
  role: Role.STUDENT as string,
};

const NotificationPage = () => {
  const [data, setData] = useState({ users: [] as IUser[] });
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiClient.get<IPageResponse<IUser> | IUser[]>('/users').then(r => {
      const d = r.data;
      setData({ users: Array.isArray(d) ? d : (d.content ?? []) });
    }).catch((err: unknown) => {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load users');
    });
  }, []);

  const handleSend = async () => {
    if (!form.message.trim()) { toast.error('Message is required'); return; }
    if (form.target === 'user' && !form.userId) { toast.error('Select a user'); return; }
    setSending(true);
    try {
      if (form.target === 'user') {
        await apiClient.post(`/notifications/send/user/${form.userId}`, { userId: form.userId, entityId: form.userId, message: form.message, category: form.category, isRead: false });
        toast.success('Notification sent to user');
      } else if (form.target === 'role') {
        await apiClient.post(`/notifications/send/role/${form.role}`, { message: form.message, category: form.category });
        toast.success(`Sent to all ${formatEnum(form.role)}s`);
      } else {
        await apiClient.post('/notifications/send/all', { message: form.message, category: form.category });
        toast.success('Broadcast sent to all users');
      }
      setForm(f => ({ ...f, message: '' }));
    } catch { toast.error('Failed to send notification'); } finally { setSending(false); }
  };

  const tgtBtn = (val: TTarget, label: string) => (
    <button
      key={val}
      onClick={() => setForm(f => ({ ...f, target: val }))}
      className={`px-4 py-1.5 rounded text-sm font-semibold cursor-pointer border transition-colors ${
        form.target === val ? 'bg-blue-dim border-blue text-blue' : 'bg-transparent border-border text-secondary'
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
            {tgtBtn('all', 'Broadcast All')}
            {tgtBtn('user', 'Specific User')}
            {tgtBtn('role', 'By Role')}
          </div>
        </div>

        {form.target === 'user' && (
          <div className="mb-4">
            <label className="form-label">Select User</label>
            <select className="form-select" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">Select a user</option>
              {data.users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          </div>
        )}

        {form.target === 'role' && (
          <div className="mb-4">
            <label className="form-label">Select Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {Object.values(Role).map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {Object.values(NotificationType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Enter notification message…" />
        </div>

        <button className="btn btn-primary font-semibold py-2 px-6" onClick={handleSend} disabled={sending}>
          {sending && <span className="spinner-border spinner-border-sm me-2" />}
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </div>
    </>
  );
};

export default NotificationPage;
