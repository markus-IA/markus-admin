"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Shield, LayoutDashboard, Users, Layers,
  Send, Copy, HeartPulse, LogOut, ChevronRight, Landmark,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/admin" },
  { icon: Users,           label: "Usuários",   href: "/admin/usuarios" },
  { icon: Landmark,        label: "Gateways",   href: "/admin/gateways" },
  { icon: Layers,          label: "Filas",      href: "/admin/filas" },
  { icon: Send,            label: "Broadcasts", href: "/admin/broadcasts" },
  { icon: Copy,            label: "Duplicatas", href: "/admin/duplicatas" },
  { icon: HeartPulse,      label: "Health",     href: "/admin/health" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, initialize, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize().then(() => setInitialized(true));
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated || user?.role !== "admin") {
      router.replace("/login");
    }
  }, [initialized, isAuthenticated, user, router]);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col bg-sidebar/60 backdrop-blur-xl border-r border-border-subtle">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-none">MARKUS</p>
              <p className="text-[9px] text-secondary tracking-widest">ADMIN</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? "bg-secondary/10 text-secondary border-l-2 border-secondary"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-primary truncate">{user?.name || user?.email}</p>
              <p className="text-[9px] text-secondary font-mono">admin</p>
            </div>
            <button
              onClick={() => logout()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Admin banner */}
        <div className="sticky top-0 z-10 flex items-center gap-2 px-6 py-2 bg-secondary/5 border-b border-secondary/20 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] text-secondary tracking-[0.15em] font-mono">
            PAINEL ADMINISTRATIVO — ACESSO RESTRITO
          </span>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-text-muted">
            <ChevronRight className="w-3 h-3" />
            <span>{pathname}</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
