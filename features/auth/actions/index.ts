"use server";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UserWithAccounts } from "../schemas";

export const getUserById = async (id: string): Promise<UserWithAccounts | null> => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        password: users.password,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new Error("User not found");

    // Fetch user's linked accounts
    const userAccounts = await db
      .select({
        provider: accounts.provider,
        providerAccountId: accounts.providerAccountId,
        type: accounts.type,
      })
      .from(accounts)
      .where(eq(accounts.userId, id));

    return {
      ...user,
      accounts: userAccounts,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    if (!account) throw new Error("Account not found");

    return account;
  } catch (error) {
    console.error("Error fetching account:", error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<UserWithAccounts | null> => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return await getUserById(session.user.id);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};
