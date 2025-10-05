import type { roleEnum } from "@/db/schema";

// Role type based on the enum values
export type UserRole = "admin" | "user" | "premium_user";

// Base user type from database schema
export type User = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  password: string | null;
  image: string | null;
  role: UserRole;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// Account type from database schema
export type Account = {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

// Extended user type with accounts
export type UserWithAccounts = User & {
  accounts: Pick<Account, "provider" | "providerAccountId" | "type">[];
};

// Auth session user type (matches NextAuth ExtendedUser)
export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
};

// API response types
export type AuthResponse = {
  success: boolean;
  user?: UserWithAccounts;
  error?: string;
};

// Form types for authentication
export type SignInFormData = {
  email: string;
  password: string;
};

export type SignUpFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Registration API types
export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
};

// Auth error types
export type AuthError = {
  error: string;
};

// NextAuth sign-in result type
export type SignInResult = {
  error?: string;
  status?: number;
  ok?: boolean;
  url?: string;
};

// Current user hook return type
export type CurrentUserState = {
  user: UserWithAccounts | null;
  loading: boolean;
  error: string | null;
};
