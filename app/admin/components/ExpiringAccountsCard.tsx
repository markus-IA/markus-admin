"use client";

import { AdminUser } from "@/types";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

interface Props {
  users: AdminUser[];
  loading: boolean;
}

export function ExpiringAccountsCard({ users, loading }: Props) {
  const now = new Date();
  const expiring = users.filter((u) => {
    if (!u.plan_expires_at || u.plan === "FREE") return false;
    const exp = new Date(u.plan_expires_at);
    const diff = diffDays(exp, now);
    return diff >= 0 && diff <= 7;
  });

  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-500/15">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Contas expirando em 7 dias
          </h3>
          {!loading && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
              {expiring.length}
            </span>
          )}
        </div>
        <Link
          href="/admin/usuarios"
          className="flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          Gerenciar
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-y divide-yellow-500/10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-48 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="h-5 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : expiring.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-[11px] text-yellow-400/60">Nenhuma conta expirando nos próximos 7 dias.</p>
        </div>
      ) : (
        <div className="divide-y divide-yellow-500/10">
          {expiring.map((user) => {
            const daysLeft = diffDays(new Date(user.plan_expires_at!), now);
            return (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {user.name || "—"}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                    {user.plan}
                  </span>
                  <span className={`text-[11px] font-mono ${daysLeft <= 2 ? "text-danger" : "text-yellow-400"}`}>
                    {daysLeft === 0 ? "hoje" : `${daysLeft}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
