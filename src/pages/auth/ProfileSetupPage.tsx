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
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-center">
          <span className="spinner-border w-8 h-8 text-blue" />
          <p className="mt-3.5 text-secondary text-sm">Checking your profile…</p>
        </div>
      </div>
    );
  }

  // ── Student — Create Profile ──────────────────────────────────────────────
  if (pageState === 'create-student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base px-4">
        <div className="auth-box max-w-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-dim flex items-center justify-center mx-auto mb-3.5">
              <BsPersonCheck size={22} className="text-blue" />
            </div>
            <h5 className="text-base text-base font-bold mb-1">Complete Your Profile</h5>
            <p className="text-xs text-secondary m-0">
              Welcome, {user?.name}! Please fill in a few personal details to get started.
            </p>
          </div>

          {/* Read-only identity info from IAM */}
          <div className="bg-subtle border border-light rounded-lg px-3.5 py-3 mb-5 text-sm">
            <div className="text-xs text-tertiary font-semibold uppercase tracking-wider mb-2">Your account details</div>
            <div className="text-base font-medium">{user?.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
              <input type="date" className="form-control" value={dob} onChange={e => setDob(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Gender <span className="text-danger">*</span></label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                <option value="">Select gender</option>
                {Object.values(Gender).map(g => <option key={g} value={g}>{formatEnum(g)}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label className="form-label">Address <span className="text-danger">*</span></label>
            <textarea className="form-control" rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Your full address" required />
          </div>

          <button className="btn btn-primary w-full mb-2.5 font-semibold" onClick={handleCreateStudent} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}
            Save & Go to Dashboard
          </button>
          <button className="btn btn-outline-secondary w-full text-xs" onClick={async () => { await logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ── Faculty — Create Profile ──────────────────────────────────────────────
  if (pageState === 'create-faculty') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base px-4">
        <div className="auth-box max-w-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-dim flex items-center justify-center mx-auto mb-3.5">
              <BsMortarboardFill size={22} className="text-blue" />
            </div>
            <h5 className="text-base text-base font-bold mb-1">Complete Your Faculty Profile</h5>
            <p className="text-xs text-secondary m-0">
              Welcome, {user?.name}! Your administrator will assign your department. You can optionally enter your position title below.
            </p>
          </div>

          {/* Read-only identity info */}
          <div className="bg-subtle border border-light rounded-lg px-3.5 py-3 mb-5 text-sm">
            <div className="text-xs text-tertiary font-semibold uppercase tracking-wider mb-2">Your account details</div>
            <div className="text-base font-medium">{user?.name}</div>
          </div>

          {/* Info note about department assignment */}
          <div className="rounded-lg p-3.5 mb-5 text-sm border border-yellow-200/40 bg-yellow-400/[0.07] text-secondary">
            Your department will be assigned by your administrator. You can update your position title at any time from your profile.
          </div>

          <div className="mb-6">
            <label className="form-label">Position / Title <span className="text-xs text-tertiary">(optional)</span></label>
            <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Associate Professor" />
          </div>

          <button className="btn btn-primary w-full mb-2.5 font-semibold" onClick={handleCreateFaculty} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}
            Save & Go to Dashboard
          </button>
          <button className="btn btn-outline-secondary w-full text-xs" onClick={async () => { await logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return null;
}
