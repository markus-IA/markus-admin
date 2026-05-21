"use client";

import { AdminUser } from "@/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "agora mesmo";
  if (min < 60) return `há ${min} minuto${min !== 1 ? "s" : ""}`;
  if (hr < 24) return `há ${hr} hora${hr !== 1 ? "s" : ""}`;
  if (day < 30) return `há ${day} dia${day !== 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

interface Props {
  users: AdminUser[];
  loading: boolean;
}


export function RecentUsersTable({ users, loading }: Props) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary">Últimos Cadastros</h3>
        <Link
          href="/admin/usuarios"
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-y divide-border-subtle">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-48 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="px-5 py-8 text-center text-text-muted text-sm">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {users.slice(0, 5).map((user) => {
            const initials = (user.name || user.email || "?")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();



            return (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {user.name || "—"}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-[11px] text-text-muted">{timeAgo(user.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
