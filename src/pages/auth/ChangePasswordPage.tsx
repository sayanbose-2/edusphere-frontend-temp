import { useState } from 'react';
import { toast } from 'react-toastify';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
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
    <div>
      <PageHeader title="Change Password" />
      <div className="card p-4" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Current Password</label>
            <input type="password" className="form-control" value={form.currentPassword} onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">New Password</label>
            <input type="password" className="form-control" value={form.newPassword} onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Confirm New Password</label>
            <input type="password" className="form-control" value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
