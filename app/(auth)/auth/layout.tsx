import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex justify-center items-center h-screen flex-col bg-zinc-800">
      {children}
    </main>
  );
}
