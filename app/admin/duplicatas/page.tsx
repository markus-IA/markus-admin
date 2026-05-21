"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDuplicate } from "@/types";
import { Copy, Filter, X, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

const ORIGIN_LABELS: Record<string, { label: string; color: string }> = {
  flow:      { label: "Fluxo",   color: "text-primary" },
  broadcast: { label: "Disparo", color: "text-secondary" },
  ai:        { label: "IA",      color: "text-yellow-400" },
  manual:    { label: "Manual",  color: "text-text-muted" },
};

const ORIGINS = ["Todos", "flow", "broadcast", "ai", "manual"] as const;
type Origin = (typeof ORIGINS)[number];

export default function AdminDuplicatasPage() {
  const [duplicates, setDuplicates] = useState<AdminDuplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState<Origin>("Todos");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiFetch<AdminDuplicate[]>("/api/v1/admin/duplicates");
      setDuplicates(data);
    } catch {
      // keep stale on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = duplicates.filter(
    (d) => filterOrigin === "Todos" || d.origin === filterOrigin
  );

  const today = duplicates.filter((d) => {
    const dt = new Date(d.last_at);
    return dt.toDateString() === new Date().toDateString();
  });

  const thisWeek = duplicates.filter((d) => {
    const dt = new Date(d.last_at);
    return dt >= new Date(Date.now() - 7 * 86400000);
  });

  const affectedLeads = new Set(duplicates.map((d) => d.lead_id)).size;

  const windowStr = (d: AdminDuplicate) => {
    const diffSec = Math.round((new Date(d.last_at).getTime() - new Date(d.first_at).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}min`;
    return `${Math.round(diffSec / 3600)}h`;
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Copy className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Duplicatas</h1>
          </div>
          <p className="text-[12px] text-text-muted">Mensagens enviadas repetidamente — últimos 7 dias</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 text-[11px] text-text-muted border border-border-subtle px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Duplicatas hoje",  value: today.length,    color: "danger" },
          { label: "Esta semana",      value: thisWeek.length, color: "secondary" },
          { label: "Leads afetados",   value: affectedLeads,   color: "primary" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-4 ${
              kpi.color === "danger"     ? "border-danger/20 bg-danger/5"
              : kpi.color === "secondary" ? "border-secondary/20 bg-secondary/5"
              : "border-primary/20 bg-primary/5"
            }`}
          >
            {loading ? (
              <div className="h-8 w-12 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <p className={`text-2xl font-bold font-mono ${
                kpi.color === "danger" ? "text-danger" : kpi.color === "secondary" ? "text-secondary" : "text-primary"
              }`}>
                {kpi.value}
              </p>
            )}
            <p className="text-[11px] text-text-muted mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[11px] text-text-muted">Origem:</span>
        {ORIGINS.map((o) => (
          <button
            key={o}
            onClick={() => setFilterOrigin(o)}
            className={`text-[11px] px-3 py-1 rounded-lg transition-colors font-mono ${
              filterOrigin === o
                ? "bg-secondary/15 text-secondary border border-secondary/30"
                : "text-text-muted hover:bg-white/5 border border-transparent"
            }`}
          >
            {o === "Todos" ? "Todos" : ORIGIN_LABELS[o]?.label || o}
          </button>
        ))}
        {filterOrigin !== "Todos" && (
          <button
            onClick={() => setFilterOrigin("Todos")}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger border border-border-subtle px-2 py-1 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">LEAD</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">BOT</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">MENSAGEM</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">REPETIÇÕES</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">ORIGEM</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">JANELA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-text-muted text-sm">Carregando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-success/70 text-sm">
                    Nenhuma duplicata encontrada. Sistema saudável.
                  </td>
                </tr>
              ) : (
                filtered.map((d, i) => {
                  const orig = ORIGIN_LABELS[d.origin];
                  return (
                    <tr key={`${d.lead_id}-${i}`} className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-text-primary">{d.lead_name || "—"}</p>
                        <p className="text-[10px] font-mono text-text-muted">{d.lead_id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-secondary">{d.bot_name || "—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-[11px] text-text-muted truncate" title={d.content}>
                          {d.content.length > 60 ? d.content.slice(0, 60) + "…" : d.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono font-bold text-danger">{d.count}×</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono ${orig?.color || "text-text-muted"}`}>
                          {orig?.label || d.origin}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-text-muted">{windowStr(d)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
