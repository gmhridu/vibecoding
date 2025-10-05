// app/api/auth/link-account/route.ts
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    provider,
    providerAccountId,
    access_token,
    refresh_token,
    expires_at,
  } = await request.json();

  try {
    // Link the account to the current user
    await db.insert(accounts).values({
      userId: session.user.id,
      type: "oauth",
      provider,
      providerAccountId,
      access_token,
      refresh_token,
      expires_at,
      token_type: "bearer",
      scope: "email profile",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error linking account:", error);
    return Response.json({ error: "Failed to link account" }, { status: 500 });
  }
}
