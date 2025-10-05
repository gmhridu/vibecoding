"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { signUpSchema, type SignUpFormData } from '@/features/auth/schemas';

const SignupClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      image: '',
    },
  });

  // TanStack Query mutation for registration
  const registerMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
          image: data.image || null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }

      return responseData;
    },
    onSuccess: (data) => {
      toast.success('Account created successfully! You can now sign in.');
      form.reset();
      router.push('/auth/sign-in');
    },
    onError: (error: any) => {
      toast.error(error.message || 'An error occurred during registration');
    },
  });

  const onSubmit = (data: SignUpFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Create an account
          </h1>
          <p className="text-zinc-400">
            Enter your information to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-zinc-500"
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Profile Image (Optional)
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || undefined}
                      onChange={(value) => field.onChange(value || '')}
                      disabled={registerMutation.isPending}
                      className="w-full cursor-pointer"
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-zinc-500 pr-10"
                        disabled={registerMutation.isPending}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={registerMutation.isPending}
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-zinc-500 pr-10"
                        disabled={registerMutation.isPending}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={registerMutation.isPending}
                      >
                        {showConfirmPassword ? (
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto text-blue-400 hover:text-blue-300 cursor-pointer"
            onClick={() => router.push('/auth/sign-in')}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupClient;
