import { apiClient } from "./axiosClient";

export interface AuthUser {
  id: string;
  email: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface SignUpResponse {
  message: string;
  user: AuthUser;
}

export interface LoginResponse {
  message: string;
  session: Session;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface GoogleOAuthResponse {
  url: string;
}


export const signUp = async (
  email: string,
  password: string
): Promise<SignUpResponse> => {
  const { data } = await apiClient.post<SignUpResponse>('/auth/signup', {
    email,
    password,
  });
  return data;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return data;
};


export const forgotPassword = async (
  email: string
): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>(
    '/auth/forgot-password',
    { email }
  );
  return data;
};


export const resetPassword = async (
  access_token: string,
  newPassword: string
): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>(
    '/auth/reset-password',
    { access_token, newPassword }
  );
  return data;
};


export const logout = async (): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/logout');
  return data;
};


export const getGoogleOAuthUrl = async (): Promise<GoogleOAuthResponse> => {
  const { data } = await apiClient.get<GoogleOAuthResponse>('/auth/google');
  return data;
};