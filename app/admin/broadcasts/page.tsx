"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminBroadcastGlobal } from "@/types";
import { AlertTriangle, Send, X, ChevronRight, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  RUNNING:   { label: "Em andamento", text: "text-primary",      bg: "bg-primary/10",      border: "border-primary/25" },
  COMPLETED: { label: "Concluído",    text: "text-success",      bg: "bg-success/10",      border: "border-success/25" },
  PAUSED:    { label: "Pausado",      text: "text-yellow-400",   bg: "bg-yellow-400/10",   border: "border-yellow-400/25" },
  ERROR:     { label: "Erro",         text: "text-danger",       bg: "bg-danger/10",       border: "border-danger/25" },
  CANCELLED: { label: "Cancelado",    text: "text-text-muted",   bg: "bg-white/5",         border: "border-white/10" },
  PENDING:   { label: "Pendente",     text: "text-text-muted",   bg: "bg-white/5",         border: "border-white/10" },
};

const TABS = ["TODOS", "RUNNING", "COMPLETED", "ERROR", "PAUSED", "PENDING"] as const;
type Tab = (typeof TABS)[number];

function DetailModal({ broadcast, onClose }: { broadcast: AdminBroadcastGlobal; onClose: () => void }) {
  const cfg = STATUS_CONFIG[broadcast.status] || STATUS_CONFIG.PENDING;
  const successPct =
    broadcast.total_leads > 0
      ? Math.round((broadcast.successful_count / broadcast.total_leads) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{broadcast.name}</h2>
            <p className="text-[11px] text-text-muted">{broadcast.user_email}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",  value: broadcast.total_leads.toLocaleString("pt-BR"),      color: "text-text-primary" },
              { label: "Sucesso", value: broadcast.successful_count.toLocaleString("pt-BR"), color: "text-success" },
              { label: "Falha",  value: broadcast.failed_count.toLocaleString("pt-BR"),     color: "text-danger" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border-subtle bg-white/2 px-3 py-3 text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>Progresso</span>
              <span className={cfg.text}>{successPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${successPct}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted">Status</span>
            <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${cfg.text} ${cfg.bg} ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("TODOS");
  const [selected, setSelected] = useState<AdminBroadcastGlobal | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await apiFetch<AdminBroadcastGlobal[]>("/api/v1/admin/broadcasts");
      setBroadcasts(data);
    } catch {
      // silently keep stale data on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = broadcasts.filter((b) => activeTab === "TODOS" || b.status === activeTab);

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("pt-BR", {
          day: "2-digit", month: "2-digit",
          hour: "2-digit", minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        })
      : "—";

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Broadcasts Globais</h1>
          </div>
          <p className="text-[12px] text-text-muted">Monitor de disparos de todos os usuários</p>
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

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => {
          const count = tab === "TODOS" ? broadcasts.length : broadcasts.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors font-mono flex items-center gap-1.5 ${
                activeTab === tab
                  ? "bg-secondary/15 text-secondary border border-secondary/30"
                  : "text-text-muted hover:bg-white/5 border border-transparent"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="text-[9px] opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">NOME</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">USUÁRIO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">STATUS</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">LEADS</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">PROGRESSO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">FALHAS</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">INICIADO</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-text-muted text-sm">Carregando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-text-muted text-sm">Nenhum broadcast encontrado.</td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
                  const successPct = b.total_leads > 0 ? Math.round((b.successful_count / b.total_leads) * 100) : 0;
                  const failedPct  = b.total_leads > 0 ? Math.round((b.failed_count / b.total_leads) * 100) : 0;

                  return (
                    <tr
                      key={b.id}
                      className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setSelected(b)}
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-text-primary max-w-[160px] truncate">{b.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-text-muted">{b.user_email || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${cfg.text} ${cfg.bg} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-text-secondary">
                          {b.total_leads.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-28">
                          <div className="flex justify-between text-[9px] text-text-muted mb-1">
                            <span>{successPct}% ok</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full flex">
                              <div className="bg-success h-full" style={{ width: `${successPct}%` }} />
                              <div className="bg-danger h-full" style={{ width: `${failedPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-mono ${b.failed_count > 0 ? "text-danger" : "text-text-muted"}`}>
                          {b.failed_count.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-muted">{formatDate(b.started_at)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <DetailModal broadcast={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
