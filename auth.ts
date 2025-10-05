import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/drizzle";
import { accounts, users, sessions, verificationTokens } from "./db/schema";
import { eq, and } from "drizzle-orm";
import authConfig from "./auth.config";
import { getAccountByUserId, getUserById } from "./features/auth/actions";

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
            name: users.name
          })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        // If user exists, we need to handle account linking manually
        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0];
          console.log(`Found existing user ${existingUser.id} with email ${existingUser.email}, attempting to link OAuth account`);

          // Check if this OAuth account is already linked to this user
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(and(
              eq(accounts.userId, existingUser.id),
              eq(accounts.provider, account.provider),
              eq(accounts.providerAccountId, account.providerAccountId)
            ))
            .limit(1);

          if (existingAccount.length > 0) {
            console.log(`OAuth account already linked to user ${existingUser.id}`);
            return true;
          }

          // For existing users, we need to manually create the account entry
          // and return false to prevent the adapter from trying to create a new user
          try {
            // Calculate proper token expiration times
            const now = Math.floor(Date.now() / 1000);
            const accessTokenExpiresAt = now + (5 * 60); // 5 minutes from now
            const refreshTokenExpiresAt = now + (90 * 24 * 60 * 60); // 90 days from now

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

            console.log(`Successfully linked OAuth account to existing user ${existingUser.id}`);
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
            name: users.name
          })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (exactMatchUsers.length > 0) {
          const existingUser = exactMatchUsers[0];
          console.log(`Found existing user ${existingUser.id} with exact email match ${user.email}`);

          // Check if this OAuth account is already linked
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(and(
              eq(accounts.userId, existingUser.id),
              eq(accounts.provider, account.provider),
              eq(accounts.providerAccountId, account.providerAccountId)
            ))
            .limit(1);

          if (existingAccount.length > 0) {
            console.log(`OAuth account already linked to user ${existingUser.id}`);
            return true;
          }

          // For existing users, we need to manually create the account entry
          try {
            // Calculate proper token expiration times
            const now = Math.floor(Date.now() / 1000);
            const accessTokenExpiresAt = now + (5 * 60); // 5 minutes from now
            const refreshTokenExpiresAt = now + (90 * 24 * 60 * 60); // 90 days from now

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

            console.log(`Successfully linked OAuth account to existing user ${existingUser.id}`);
            return true;
          } catch (linkError) {
            console.error("Error linking OAuth account:", linkError);
            return false;
          }
        }

        // If no existing user, this is a new user, proceed with normal flow
        console.log(`No existing user found with email ${user.email}, creating new user`);
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
          const existingUser = await getUserById(token.sub);
          if (existingUser) {
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
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
    maxAge: 5 * 60, // 5 minutes for access tokens
  },
  ...authConfig,
});
