import { useState } from 'react';
import { toast } from 'react-toastify';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Change Password" subtitle="Update your account password" />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '28px 32px', maxWidth: 480, boxShadow: 'var(--shadow)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Current Password</label>
            <input type="password" className="form-control" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">New Password</label>
            <input type="password" minLength={8} className="form-control" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 8 characters" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-control" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontWeight: 600, padding: '9px 20px' }}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </>
  );
}
