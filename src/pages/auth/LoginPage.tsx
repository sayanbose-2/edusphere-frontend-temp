import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
      await login({ email, password });
      toast.success('Welcome back!');
      navigate('/dashboard');
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
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <BsMortarboardFill size={32} style={{ color: '#60A5FA' }} />
          </div>
          <h2 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 28, margin: '0 0 8px', letterSpacing: '-0.5px' }}>EduSphere</h2>
          <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 14, margin: '0 0 44px', lineHeight: 1.6 }}>Integrated Academic Management System</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {[
              { icon: <BsPeopleFill size={14} />, title: 'Multi-Role Access',  desc: 'Students, Faculty, Admins & more' },
              { icon: <BsBook size={14} />,        title: 'Academic Records',   desc: 'Grades, courses, and curriculum' },
              { icon: <BsAwardFill size={14} />,   title: 'Research & Thesis',  desc: 'End-to-end project tracking' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ color: 'rgba(241,245,249,0.4)', fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <BsMortarboardFill size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <h5 style={{ color: 'var(--text)', fontWeight: 700, margin: '0 0 5px', fontSize: 18 }}>Sign in to EduSphere</h5>
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading} style={{ padding: '10px', fontWeight: 600, fontSize: 14 }}>
              {loading && <span className="spinner-border spinner-border-sm me-2" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0, fontSize: 13, color: 'var(--text-2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
