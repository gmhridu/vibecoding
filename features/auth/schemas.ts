import { z } from "zod";

// Sign in form schema
export const signInSchema = z.object({
  email: z
     .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// Sign up form schema
export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
  image: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Extended user type with accounts (for auth actions)
export type UserWithAccounts = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  password: string | null;
  image: string | null;
  role: "admin" | "user" | "premium_user";
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  accounts: Array<{
    provider: string;
    providerAccountId: string;
    type: string;
  }>;
};

// TypeScript types from schemas
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
