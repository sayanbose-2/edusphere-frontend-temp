import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/services/student.service';
import { facultyService } from '@/services/faculty.service';
import { Role, Gender } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import { toast } from 'react-toastify';
import { BsMortarboardFill, BsPersonCheck } from 'react-icons/bs';

type PageState = 'loading' | 'create-student' | 'create-faculty';

export default function ProfileSetupPage() {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');

  // Student fields
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  // Faculty field
  const [position, setPosition] = useState('');

  const [saving, setSaving] = useState(false);

  const goToDashboard = () => navigate('/dashboard', { replace: true });

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        if (hasRole(Role.STUDENT)) {
          await studentService.getMe();
          // Profile already exists — go straight to dashboard
          goToDashboard();
        } else if (hasRole(Role.FACULTY)) {
          await facultyService.getMe();
          // Profile already exists (admin pre-created) — go straight to dashboard
          goToDashboard();
        } else {
          // ADMIN, DEPT_HEAD, COMPLIANCE_OFFICER — no profile step
          goToDashboard();
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          // No profile yet — show the creation form
          if (hasRole(Role.STUDENT)) setPageState('create-student');
          else if (hasRole(Role.FACULTY)) setPageState('create-faculty');
          else goToDashboard();
        } else {
          // Unexpected error — let them in anyway
          goToDashboard();
        }
      }
    })();
  }, [user?.id]);

  // ── Student self-create ───────────────────────────────────────────────────
  const handleCreateStudent = async () => {
    if (!dob || !gender || !address.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await studentService.createMe({ dob, gender, address });
      toast.success('Profile created! Welcome to EduSphere.');
      goToDashboard();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Faculty self-create ───────────────────────────────────────────────────
  const handleCreateFaculty = async () => {
    setSaving(true);
    try {
      await facultyService.createMe({ position: position.trim() || undefined });
      toast.success('Profile created! Welcome to EduSphere.');
      goToDashboard();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner-border" style={{ color: 'var(--blue)', width: 32, height: 32 }} />
          <p style={{ marginTop: 14, color: 'var(--text-2)', fontSize: 14 }}>Checking your profile…</p>
        </div>
      </div>
    );
  }

  // ── Student — Create Profile ──────────────────────────────────────────────
  if (pageState === 'create-student') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px' }}>
        <div className="auth-box" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <BsPersonCheck size={22} style={{ color: 'var(--blue)' }} />
            </div>
            <h5 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Complete Your Profile</h5>
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>
              Welcome, {user?.name}! Please fill in a few personal details to get started.
            </p>
          </div>

          {/* Read-only identity info from IAM */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
            <div style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Your account details</div>
            <div style={{ color: 'var(--text)', fontWeight: 500 }}>{user?.name}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Date of Birth <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" className="form-control" value={dob} onChange={e => setDob(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                <option value="">Select gender</option>
                {Object.values(Gender).map(g => <option key={g} value={g}>{formatEnum(g)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Address <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea className="form-control" rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Your full address" required />
          </div>

          <button className="btn btn-primary w-100" onClick={handleCreateStudent} disabled={saving} style={{ marginBottom: 10, fontWeight: 600 }}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}
            Save & Go to Dashboard
          </button>
          <button className="btn btn-outline-secondary w-100" style={{ fontSize: 13 }} onClick={async () => { await logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ── Faculty — Create Profile ──────────────────────────────────────────────
  if (pageState === 'create-faculty') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px' }}>
        <div className="auth-box" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <BsMortarboardFill size={22} style={{ color: 'var(--blue)' }} />
            </div>
            <h5 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Complete Your Faculty Profile</h5>
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>
              Welcome, {user?.name}! Your administrator will assign your department. You can optionally enter your position title below.
            </p>
          </div>

          {/* Read-only identity info */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
            <div style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Your account details</div>
            <div style={{ color: 'var(--text)', fontWeight: 500 }}>{user?.name}</div>
          </div>

          {/* Info note about department assignment */}
          <div style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-2)' }}>
            Your department will be assigned by your administrator. You can update your position title at any time from your profile.
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Position / Title <span style={{ color: 'var(--text-3)', fontSize: 12 }}>(optional)</span></label>
            <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Associate Professor" />
          </div>

          <button className="btn btn-primary w-100" onClick={handleCreateFaculty} disabled={saving} style={{ marginBottom: 10, fontWeight: 600 }}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}
            Save & Go to Dashboard
          </button>
          <button className="btn btn-outline-secondary w-100" style={{ fontSize: 13 }} onClick={async () => { await logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return null;
}
