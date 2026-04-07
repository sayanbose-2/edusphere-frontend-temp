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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-panel-left d-none d-lg-flex">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div className="auth-logo-ring" style={{ width: 80, height: 80 }}>
            <BsMortarboardFill size={36} style={{ color: '#f0a500' }} />
          </div>
          <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.8rem', margin: '16px 0 8px', letterSpacing: '-0.3px' }}>
            EduSphere
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 40 }}>
            Integrated Academic Management System
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            {[
              { icon: <BsPeopleFill size={16} />, title: 'Multi-Role Access', desc: 'Students, Faculty, Admins & more' },
              { icon: <BsBook size={16} />, title: 'Academic Records', desc: 'Grades, courses, and curriculum' },
              { icon: <BsAwardFill size={16} />, title: 'Research & Thesis', desc: 'Track academic projects end-to-end' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0a500', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.88rem' }}>{item.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="text-center mb-4">
            <div className="d-lg-none mb-3">
              <div className="auth-logo-ring" style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', width: 56, height: 56 }}>
                <BsMortarboardFill size={24} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <h5 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>
              Welcome back
            </h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
              Sign in to your EduSphere account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading} style={{ padding: '10px', fontSize: '0.9rem' }}>
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" style={{ color: '#fff' }} />
                : null}
              Sign In
            </button>
          </form>

          <p className="text-center mt-3 mb-0" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
