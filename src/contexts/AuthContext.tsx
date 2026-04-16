import { createContext, useContext, useState, type ReactNode } from 'react';
import { decodeJwt, isTokenExpired } from '@/lib/jwt';
import { TOKEN_KEYS } from '@/lib/constants';
import apiClient from '@/api/client';
import { Role } from '@/types/enums';
import type { IAuthUser, ILoginRequest, IRegisterRequest } from '@/types/authTypes';

interface AuthContextValue {
  user: IAuthUser | null;
  login: (data: ILoginRequest) => Promise<Role[]>;
  register: (data: IRegisterRequest) => Promise<Role[]>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// read token from storage once at startup, no effect needed
const initUser = (): IAuthUser | null => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (!token) return null;
  try {
    if (isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      return null;
    }
    const decoded = decodeJwt(token);
    return { id: decoded.userId, name: decoded.name, roles: decoded.roles as Role[] };
  } catch {
    localStorage.clear();
    return null;
  }
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IAuthUser | null>(initUser);

  const login = async (data: ILoginRequest): Promise<Role[]> => {
    const { accessToken, refreshToken } = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/login', data).then(r => r.data);
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    const decoded = decodeJwt(accessToken);
    const roles = decoded.roles as Role[];
    setUser({ id: decoded.userId, name: decoded.name, roles });
    return roles;
  };

  const register = async (data: IRegisterRequest): Promise<Role[]> => {
    const { accessToken, refreshToken } = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/register', data).then(r => r.data);
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    const decoded = decodeJwt(accessToken);
    const roles = decoded.roles as Role[];
    setUser({ id: decoded.userId, name: decoded.name, roles });
    return roles;
  };

  const logout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => !!user && roles.some(r => user.roles.includes(r));

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { AuthProvider, useAuth };
