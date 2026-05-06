export interface User {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  avatarUrl: string | null;
  provider: string;
  active: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  username: string;
  password: string;
  otp?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AdminDeactivateResponse {
  userId: number;
  deactivated: boolean;
}
