"use client";

import { AdminStats } from "@/types";
import { Users, UserCheck, UserPlus, BarChart2, Database, Zap, TrendingUp, DollarSign } from "lucide-react";

interface Props {
  data: AdminStats | null;
  loading: boolean;
}

const cards = [
  {
    key: "active_users" as keyof AdminStats,
    label: "Usuários Ativos",
    icon: UserCheck,
    color: "cyan",
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
  {
    key: "new_users_week" as keyof AdminStats,
    label: "Novos (7 dias)",
    icon: UserPlus,
    color: "purple",
    format: (v: number) => `+${v.toLocaleString("pt-BR")}`,
  },
  {
    key: "total_leads" as keyof AdminStats,
    label: "Total de Leads",
    icon: Database,
    color: "cyan",
    format: (v: number) => v.toLocaleString("pt-BR"),
  },
  {
    key: "total_revenue" as keyof AdminStats,
    label: "Receita Total",
    icon: DollarSign,
    color: "green",
    format: (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  },
];

export function AdminKpiGrid({ data, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = data ? (data[card.key] as number) : 0;
        const isCyan = card.color === "cyan";
        const isPurple = card.color === "purple";
        const isGreen = card.color === "green";

        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
              isCyan
                ? "bg-primary/5 border-primary/15 hover:border-primary/30 hover:bg-primary/8"
                : isPurple
                ? "bg-secondary/5 border-secondary/15 hover:border-secondary/30 hover:bg-secondary/8"
                : "bg-success/5 border-success/15 hover:border-success/30 hover:bg-success/8"
            }`}
          >
            {/* Background glow */}
            <div
              className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 ${
                isCyan ? "bg-primary" : isPurple ? "bg-secondary" : "bg-success"
              }`}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCyan
                      ? "bg-primary/15"
                      : isPurple
                      ? "bg-secondary/15"
                      : "bg-success/15"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isCyan
                        ? "text-primary"
                        : isPurple
                        ? "text-secondary"
                        : "text-success"
                    }`}
                  />
                </div>
              </div>

              {loading ? (
                <div className="h-7 w-24 bg-white/5 rounded animate-pulse mb-1" />
              ) : (
                <p
                  className={`text-2xl font-bold font-mono ${
                    isCyan
                      ? "text-primary"
                      : isPurple
                      ? "text-secondary"
                      : "text-success"
                  }`}
                >
                  {card.format(value)}
                </p>
              )}
              <p className="text-[11px] text-text-muted mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
