
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  emailVerified: boolean;
  status: string;
  roles?: string[];
  role?: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export interface RefreshTokenResponse {
  message: string;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshTokenExpiresAt: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  status: number | string;
  data?: {
    message?: string | string[];
    error?: string;
    statusCode?: number;
  };
}
