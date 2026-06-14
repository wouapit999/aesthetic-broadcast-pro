"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { useApp } from "@/components/Providers";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/segments", label: "Segments", icon: "🎯" },
  { href: "/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/templates", label: "Templates", icon: "📝" },
  { href: "/automation", label: "Automation", icon: "⚡" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, settings } = useApp();

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white"
          style={{ background: "var(--color-primary)" }}
        >
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="logo"
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            "✨"
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {settings?.businessName ?? "Aesthetic Pro"}
          </p>
          <p className="text-xs text-gray-400">Broadcast Suite</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              style={active ? { background: "var(--color-primary)" } : undefined}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <p className="truncate px-2 text-xs text-gray-400">{user?.email}</p>
        <button onClick={logout} className="btn-ghost mt-2 w-full">
          Sign out
        </button>
      </div>
    </aside>
  );
}
