import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enums';
import { toast } from 'react-toastify';
import { BsMortarboardFill, BsBook, BsPeopleFill, BsAwardFill } from 'react-icons/bs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roles = await login({ email, password });
      toast.success('Welcome back!');
      // Students and Faculty always check profile setup on login.
      // ProfileSetupPage internally redirects to dashboard if profile already exists.
      const needsProfileCheck = roles.some(r => r === Role.STUDENT || r === Role.FACULTY);
      navigate(needsProfileCheck ? '/profile/setup' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="relative z-10 text-center max-w-xs">
          <div className="w-18 h-18 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
            <BsMortarboardFill size={32} className="text-blue-300" />
          </div>
          <h2 className="text-blue-50 font-black text-2xl mb-2 tracking-tight">EduSphere</h2>
          <p className="text-blue-50/50 text-sm mb-11 leading-relaxed">Integrated Academic Management System</p>

          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: <BsPeopleFill size={14} />, title: 'Multi-Role Access',  desc: 'Students, Faculty, Admins & more' },
              { icon: <BsBook size={14} />,        title: 'Academic Records',   desc: 'Grades, courses, and curriculum' },
              { icon: <BsAwardFill size={14} />,   title: 'Research & Thesis',  desc: 'End-to-end project tracking' },
            ].map(item => (
              <div key={item.title} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-lg bg-blue-400/10 border border-blue-400/[0.18] flex items-center justify-center text-blue-300 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-blue-50 font-semibold text-sm">{item.title}</div>
                  <div className="text-blue-50/40 text-xs mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="text-center mb-7">
            <div className="w-11 h-11 rounded-xl bg-blue-dim flex items-center justify-center mx-auto mb-3.5">
              <BsMortarboardFill size={20} className="text-blue" />
            </div>
            <h5 className="text-base text-base font-bold mb-1">Sign in to EduSphere</h5>
            <p className="text-xs text-secondary m-0">
              Use the credentials provided by your administrator
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="mb-6">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary w-full py-2.5 font-semibold text-sm" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-5 mb-0 text-xs text-secondary">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
