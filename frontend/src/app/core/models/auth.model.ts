export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: GenderType;
  birthDate: string;
  phone: string;
  role: 'ADMIN' | 'USER';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: GenderType;
  birthDate: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}