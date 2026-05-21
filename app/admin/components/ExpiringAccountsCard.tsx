"use client";

import { AdminUser } from "@/types";
import { XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  users: AdminUser[];
  loading: boolean;
}

export function ExpiringAccountsCard({ users, loading }: Props) {
  const inactive = users.filter((u) => !u.is_active);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-danger" />
          <h3 className="text-sm font-semibold text-text-primary">
            Contas Inativas
          </h3>
          {!loading && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger">
              {inactive.length}
            </span>
          )}
        </div>
        <Link
          href="/admin/usuarios"
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
          Gerenciar
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-y divide-border-subtle">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-48 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : inactive.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-[11px] text-text-muted">Nenhuma conta inativa.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {inactive.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {user.name || "—"}
                </p>
                <p className="text-[11px] text-text-muted truncate">{user.email}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger shrink-0">
                inativo
              </span>
            </div>
          ))}
          {inactive.length > 5 && (
            <div className="px-5 py-3 text-center">
              <p className="text-[10px] text-text-muted">+{inactive.length - 5} contas inativas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
