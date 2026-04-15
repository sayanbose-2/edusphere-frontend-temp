import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enums';
import { toast } from 'react-toastify';
import { BsMortarboardFill } from 'react-icons/bs';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', selectedRole: Role.STUDENT as Role });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, roles: [form.selectedRole] });
      // Auto-logged in — clear any old setup flag so the setup page is always shown after fresh registration
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { decodeJwt } = await import('@/lib/jwt');
          const decoded = decodeJwt(token);
          localStorage.removeItem(`profileSetupSeen_${decoded.userId}`);
        } catch { /* ignore */ }
      }
      toast.success('Account created! Please complete your profile.');
      navigate('/profile/setup');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data;
      const msg = (data?.errors ? Object.values(data.errors).join(', ') : undefined) || data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-right bg-base min-h-screen">
      <div className="auth-box max-w-sm">
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-dim flex items-center justify-center mx-auto mb-3.5">
            <BsMortarboardFill size={20} className="text-blue" />
          </div>
          <h5 className="text-base font-bold m-0 mb-1">Create your account</h5>
          <p className="text-xs text-secondary m-0">Join EduSphere today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" required />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Password</label>
            <input type="password" minLength={8} className="form-control" name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Phone <span className="text-xs text-tertiary">(optional)</span></label>
            <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="mb-6">
            <label className="form-label">I am a</label>
            <select className="form-select" name="selectedRole" value={form.selectedRole} onChange={handleChange}>
              <option value={Role.STUDENT}>Student</option>
              <option value={Role.FACULTY}>Faculty Member</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full py-2.5 font-semibold text-sm" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-5 mb-0 text-xs text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
