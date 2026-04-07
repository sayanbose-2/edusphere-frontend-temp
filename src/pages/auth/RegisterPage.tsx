import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enums';
import { toast } from 'react-toastify';
import { BsMortarboardFill } from 'react-icons/bs';
import { formatEnum } from '@/utils/formatters';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    selectedRole: Role.STUDENT as Role,
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        roles: [form.selectedRole],
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data;
      const validationMessage = data?.errors ? Object.values(data.errors).join(', ') : undefined;
      const msg = validationMessage || data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="auth-logo-ring" style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', width: 56, height: 56, margin: '0 auto 12px' }}>
            <BsMortarboardFill size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h5 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>Create Account</h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>Join EduSphere today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Full Name</label>
            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
            <input type="password" minLength={8} className="form-control" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Phone</label>
            <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Role</label>
            <select className="form-select" name="selectedRole" value={form.selectedRole} onChange={handleChange}>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>{formatEnum(r)}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Register
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
