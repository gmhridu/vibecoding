import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db/drizzle";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const user = await db
            .select({
              id: users.id,
              email: users.email,
              password: users.password,
              name: users.name,
              image: users.image,
              role: users.role,
              isActive: users.isActive,
            })
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (!user[0]) {
            throw new Error("No user found with this email");
          }

          if (!user[0].password) {
            throw new Error("This account doesn't have a password set");
          }

          if (!user[0].isActive) {
            throw new Error("This account has been deactivated");
          }

          const isPasswordValid = await compare(
            credentials.password as string,
            user[0].password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
            role: user[0].role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
