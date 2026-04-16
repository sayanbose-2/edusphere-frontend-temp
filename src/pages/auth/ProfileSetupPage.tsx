import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { Role } from '@/types/enums';
import StudentProfileForm from '@/components/auth/StudentProfileForm';
import FacultyProfileForm from '@/components/auth/FacultyProfileForm';

type PageState = 'loading' | 'create-student' | 'create-faculty';

const ProfileSetupPage = () => {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');

  const goToDashboard = () => navigate('/dashboard', { replace: true });
  const handleSignOut = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (hasRole(Role.STUDENT)) await apiClient.get('/students/me');
        else if (hasRole(Role.FACULTY)) await apiClient.get('/faculties/me');
        goToDashboard();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          if (hasRole(Role.STUDENT)) setPageState('create-student');
          else if (hasRole(Role.FACULTY)) setPageState('create-faculty');
          else goToDashboard();
        } else {
          goToDashboard();
        }
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (pageState === 'create-student') {
    return <StudentProfileForm name={user?.name ?? ''} onDone={goToDashboard} onSignOut={handleSignOut} />;
  }

  if (pageState === 'create-faculty') {
    return <FacultyProfileForm name={user?.name ?? ''} onDone={goToDashboard} onSignOut={handleSignOut} />;
  }

  return null;
};

export default ProfileSetupPage;
