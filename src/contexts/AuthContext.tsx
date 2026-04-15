import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { decodeJwt, isTokenExpired } from '@/lib/jwt';
import { TOKEN_KEYS } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { Role } from '@/types/enums';
import type { AuthUser, LoginRequest } from '@/types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  login: (data: LoginRequest) => Promise<Role[]>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (token) {
      try {
        if (isTokenExpired(token)) {
          localStorage.removeItem(TOKEN_KEYS.ACCESS);
          localStorage.removeItem(TOKEN_KEYS.REFRESH);
        } else {
          const decoded = decodeJwt(token);
          setUser({
            id: decoded.userId,
            name: decoded.name,
            roles: decoded.roles as Role[],
          });
        }
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (data: LoginRequest): Promise<Role[]> => {
    const { accessToken, refreshToken } = await authService.login(data);
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    const decoded = decodeJwt(accessToken);
    const roles = decoded.roles as Role[];
    setUser({ id: decoded.userId, name: decoded.name, roles });
    return roles;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, hasRole, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
