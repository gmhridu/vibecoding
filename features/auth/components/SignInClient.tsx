"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Github, Mail, Eye, EyeOff } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signInSchema, type SignInFormData } from "@/features/auth/schemas";

const SignInClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading("credentials");

    try {
      // Sign in with NextAuth directly (password verification handled by NextAuth)
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Successfully signed in!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(provider);

    try {
      await signIn(provider, {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-400">Sign in to your account to continue</p>
        </div>

        {/* OAuth Providers */}
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 hover:text-gray-300 text-white h-11 cursor-pointer"
            onClick={() => handleOAuthSignIn("github")}
            disabled={isLoading !== null && isLoading !== "credentials"}
          >
            {isLoading === "github" ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            Continue with GitHub
          </Button>

          <Button
            variant="outline"
            className="w-full bg-zinc-800 border-zinc-600 hover:bg-zinc-700 hover:text-gray-300 text-white h-11 cursor-pointer"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading !== null && isLoading !== "credentials"}
          >
            {isLoading === "google" ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-zinc-500"
                      disabled={isLoading === "credentials"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-zinc-500 pr-10"
                        disabled={isLoading === "credentials"}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading === "credentials"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-zinc-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 cursor-pointer"
              disabled={isLoading === "credentials"}
            >
              {isLoading === "credentials" ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Email
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-zinc-400 mt-6">
          Don't have an account?{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-blue-400 hover:text-blue-300 cursor-pointer"
            onClick={() => router.push("/auth/sign-up")}
          >
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignInClient;
