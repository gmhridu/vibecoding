import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/drizzle";
import { accounts, users, sessions, verificationTokens } from "./db/schema";
import { eq, and } from "drizzle-orm";
import authConfig from "./auth.config";
import { getUserById } from "./features/auth/actions";

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow credentials provider to proceed
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth providers
      if (!user || !account || !user.email) return false;

      try {
        // Normalize email to lowercase for comparison
        const normalizedEmail = user.email.toLowerCase();

        // Check if a user with this email already exists (case-insensitive)
        const existingUsers = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
          })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!existingUsers || existingUsers.length === 0) {
          return true;
        }

        // If user exists, we need to handle account linking manually
        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0];

          // Check if this OAuth account is already linked to this user
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.userId, existingUser.id),
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (existingAccount.length > 0) {
            return true;
          }

          // For existing users, we need to manually create the account entry
          // and return false to prevent the adapter from trying to create a new user
          try {
            // Calculate proper token expiration times
            const now = Math.floor(Date.now() / 1000);
            const accessTokenExpiresAt = now + 5 * 60; // 5 minutes from now
            const refreshTokenExpiresAt = now + 90 * 24 * 60 * 60; // 90 days from now

            await db.insert(accounts).values({
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token || undefined,
              access_token: account.access_token || undefined,
              expires_at: refreshTokenExpiresAt, // Use refresh token expiration for accounts table
              token_type: account.token_type || undefined,
              scope: account.scope || undefined,
              id_token: account.id_token || undefined,
              session_state: account.session_state || undefined,
            } as any);

            // If this is a Google OAuth and user doesn't have an image, fetch and save profile image
            if (account.provider === "google" && !existingUser.image && profile?.picture) {
              try {
                await db
                  .update(users)
                  .set({ image: profile.picture })
                  .where(eq(users.id, existingUser.id));
              } catch (imageError) {
                console.error("Error updating profile image:", imageError);
              }
            }
            return true;
          } catch (linkError) {
            console.error("Error linking OAuth account:", linkError);
            return false;
          }
        }

        // Also try the original email case in case database has different casing
        const exactMatchUsers = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
          })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (exactMatchUsers.length > 0) {
          const existingUser = exactMatchUsers[0];

          // Check if this OAuth account is already linked
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.userId, existingUser.id),
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (existingAccount.length > 0) {
            return true;
          }

          // For existing users, we need to manually create the account entry
          try {
            // Calculate proper token expiration times
            const now = Math.floor(Date.now() / 1000);
            const accessTokenExpiresAt = now + 5 * 60; // 5 minutes from now
            const refreshTokenExpiresAt = now + 90 * 24 * 60 * 60; // 90 days from now

            await db.insert(accounts).values({
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token || undefined,
              access_token: account.access_token || undefined,
              expires_at: refreshTokenExpiresAt, // Use refresh token expiration for accounts table
              token_type: account.token_type || undefined,
              scope: account.scope || undefined,
              id_token: account.id_token || undefined,
              session_state: account.session_state || undefined,
            } as any);

            // If this is a Google OAuth and user doesn't have an image, fetch and save profile image
            if (account.provider === "google" && !existingUser.image && profile?.picture) {
              try {
                await db
                  .update(users)
                  .set({ image: profile.picture })
                  .where(eq(users.id, existingUser.id));
              } catch (imageError) {
                console.error("Error updating profile image:", imageError);
              }
            }

            return true;
          } catch (linkError) {
            console.error("Error linking OAuth account:", linkError);
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      // Update token when session is updated
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      // Get fresh user data
      if (token.sub) {
        try {
          // Use direct database query instead of getUserById to avoid context issues
          const existingUsers = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            })
            .from(users)
            .where(eq(users.id, token.sub))
            .limit(1);

          if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
          } else {
            console.error(`JWT callback: No user found with ID ${token.sub}`);
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
          console.error("Token sub:", token.sub);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role || "user";
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      } else {
        console.error("Session callback - missing token.sub or session.user");
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET!,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours for access tokens
  },
  ...authConfig,
});
