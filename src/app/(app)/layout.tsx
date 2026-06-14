"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useApp } from "@/components/Providers";
import { getToken } from "@/lib/api";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, user } = useApp();

  useEffect(() => {
    if (!loading && (!user || !getToken())) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
