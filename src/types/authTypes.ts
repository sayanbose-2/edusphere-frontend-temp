import { Role } from '@/types/enums';

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roles: Role[];
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IJwtPayload {
  sub: string;
  userId: string;
  name: string;
  roles: string[];
  type: string;
  exp: number;
  iat: number;
}

export interface IAuthUser {
  id: string;
  name: string;
  email?: string;
  roles: Role[];
}
