"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { AdminStats, AdminUser } from "@/types";
import { AdminKpiGrid } from "./components/AdminKpiGrid";
import { RecentUsersTable } from "./components/RecentUsersTable";
import { ExpiringAccountsCard } from "./components/ExpiringAccountsCard";
import { Shield, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        apiFetch<AdminStats>("/api/v1/admin/stats"),
        apiFetch<AdminUser[]>("/api/v1/admin/users"),
      ]);
      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Admin Dashboard</h1>
          </div>
          <p className="text-[12px] text-text-muted">
            Visão global da plataforma Markus
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <AdminKpiGrid data={stats} loading={loading} />

      {/* Secondary stats row */}
      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Usuários", value: stats.total_users.toLocaleString("pt-BR") },
            { label: "Total Bots", value: stats.total_bots.toLocaleString("pt-BR") },
            { label: "Total Fluxos", value: stats.total_flows.toLocaleString("pt-BR") },
            { label: "Leads esta semana", value: `+${stats.new_leads_week.toLocaleString("pt-BR")}` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-subtle bg-surface px-4 py-3"
            >
              <p className="text-xs font-mono font-semibold text-text-primary">{item.value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentUsersTable users={users} loading={loading} />
        <ExpiringAccountsCard users={users} loading={loading} />
      </div>
    </div>
  );
}
