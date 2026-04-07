import { Role } from '@/types/enums';

// ========================
// Auth
// ========================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roles: Role[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface JwtPayload {
  sub: string;
  userId: string;
  name: string;
  roles: string[];
  type: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  roles: Role[];
}
