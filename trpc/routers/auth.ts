import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "../init";

// Input validation schemas
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.email("Invalid email address").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  image: z.string().optional(),
});

const signinSchema = z.object({
  email: z.email("Invalid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

export const authRouter = createTRPCRouter({
  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new Error("User with this email already exists!");
        }

        // Hash the password
        const hashedPassword = await hash(input.password, 12);

        // Create the user
        const newUser = await db
          .insert(users)
          .values({
            name: input.name,
            email: input.email,
            password: hashedPassword,
            image: input.image || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            createdAt: users.createdAt,
          });

        return {
          success: true,
          user: newUser[0],
          message: "Account created successfully",
        };
      } catch (error: any) {
        throw new Error(error.message || "Registration failed");
      }
    }),

  signin: baseProcedure
    .input(signinSchema)
    .mutation(async ({ input }) => {
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
          .where(eq(users.email, input.email))
          .limit(1);

        if (!user[0]) {
          throw new Error("Invalid email or password");
        }

        if (!user[0].password) {
          throw new Error("This account doesn't have a password set");
        }

        if (!user[0].isActive) {
          throw new Error("This account has been deactivated");
        }

        // Note: Password verification is handled by NextAuth credentials provider
        // This mutation is for additional validation if needed

        return {
          success: true,
          user: {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
            role: user[0].role,
          },
          message: "Sign in successful",
        };
      } catch (error: any) {
        throw new Error(error.message || "Sign in failed");
      }
    }),
});

export type AuthRouter = typeof authRouter;
