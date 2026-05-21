"use client";

import { useState } from "react";
import { AdminBroadcastGlobal } from "@/types";
import { AlertTriangle, Send, X, ChevronRight } from "lucide-react";

const BROADCASTS: AdminBroadcastGlobal[] = [
  {
    id: "b1",
    name: "Lançamento Premium Q2",
    user_email: "joao@markus.business",
    status: "RUNNING",
    total_leads: 5200,
    successful_count: 3100,
    failed_count: 48,
    started_at: "2026-05-20T18:00:00Z",
  },
  {
    id: "b2",
    name: "Reengajamento Inativos",
    user_email: "maria@negocio.com",
    status: "COMPLETED",
    total_leads: 1800,
    successful_count: 1752,
    failed_count: 12,
    started_at: "2026-05-20T10:30:00Z",
  },
  {
    id: "b3",
    name: "Oferta Flash 24h",
    user_email: "ana@empresa.io",
    status: "PAUSED",
    total_leads: 3400,
    successful_count: 1200,
    failed_count: 5,
    started_at: "2026-05-20T14:15:00Z",
  },
  {
    id: "b4",
    name: "Black Friday Antecipada",
    user_email: "carlos@shop.com",
    status: "ERROR",
    total_leads: 900,
    successful_count: 210,
    failed_count: 690,
    started_at: "2026-05-19T20:00:00Z",
  },
  {
    id: "b5",
    name: "Newsletter Semanal",
    user_email: "time@agencia.br",
    status: "PENDING",
    total_leads: 7500,
    successful_count: 0,
    failed_count: 0,
    started_at: null,
  },
];

const STATUS_CONFIG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  RUNNING: { label: "Em andamento", text: "text-primary", bg: "bg-primary/10", border: "border-primary/25" },
  COMPLETED: { label: "Concluído", text: "text-success", bg: "bg-success/10", border: "border-success/25" },
  PAUSED: { label: "Pausado", text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/25" },
  ERROR: { label: "Erro", text: "text-danger", bg: "bg-danger/10", border: "border-danger/25" },
  CANCELLED: { label: "Cancelado", text: "text-text-muted", bg: "bg-white/5", border: "border-white/10" },
  PENDING: { label: "Pendente", text: "text-text-muted", bg: "bg-white/5", border: "border-white/10" },
};

const TABS = ["TODOS", "RUNNING", "COMPLETED", "ERROR", "PAUSED", "PENDING"] as const;
type Tab = (typeof TABS)[number];

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ broadcast, onClose }: { broadcast: AdminBroadcastGlobal; onClose: () => void }) {
  const cfg = STATUS_CONFIG[broadcast.status] || STATUS_CONFIG.PENDING;
  const successPct =
    broadcast.total_leads > 0
      ? Math.round((broadcast.successful_count / broadcast.total_leads) * 100)
      : 0;

  const MOCK_ERRORS = [
    { reason: "Telegram: user is deactivated", count: Math.floor(broadcast.failed_count * 0.6) },
    { reason: "Telegram: bot was blocked by the user", count: Math.floor(broadcast.failed_count * 0.3) },
    { reason: "flow not found", count: Math.ceil(broadcast.failed_count * 0.1) },
  ].filter((e) => e.count > 0);

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
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: broadcast.total_leads.toLocaleString("pt-BR"), color: "text-text-primary" },
              { label: "Sucesso", value: broadcast.successful_count.toLocaleString("pt-BR"), color: "text-success" },
              { label: "Falha", value: broadcast.failed_count.toLocaleString("pt-BR"), color: "text-danger" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border-subtle bg-white/2 px-3 py-3 text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>Progresso</span>
              <span>{successPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${successPct}%` }}
              />
            </div>
          </div>

          {/* Error breakdown */}
          {broadcast.failed_count > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-secondary mb-2">Erros por tipo (mock)</p>
              <div className="rounded-lg border border-danger/15 bg-danger/5 divide-y divide-danger/10">
                {MOCK_ERRORS.map((e) => (
                  <div key={e.reason} className="flex items-center justify-between px-4 py-2">
                    <span className="text-[11px] text-text-secondary">{e.reason}</span>
                    <span className="text-[11px] font-mono text-danger">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBroadcastsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("TODOS");
  const [selected, setSelected] = useState<AdminBroadcastGlobal | null>(null);

  const filtered = BROADCASTS.filter(
    (b) => activeTab === "TODOS" || b.status === activeTab
  );

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Broadcasts Globais</h1>
          </div>
          <p className="text-[12px] text-text-muted">Monitor de disparos de todos os usuários</p>
        </div>
      </div>

      {/* Mock banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-400/25 bg-yellow-400/5">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <p className="text-[11px] text-yellow-400">
          <span className="font-semibold">Dados mockados</span> — endpoint admin sem filtro de user_id em desenvolvimento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors font-mono ${
              activeTab === tab
                ? "bg-secondary/15 text-secondary border border-secondary/30"
                : "text-text-muted hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-text-muted text-sm">
                    Nenhum broadcast encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
                  const pct =
                    b.total_leads > 0
                      ? Math.round(((b.successful_count + b.failed_count) / b.total_leads) * 100)
                      : 0;
                  const successPct =
                    b.total_leads > 0
                      ? Math.round((b.successful_count / b.total_leads) * 100)
                      : 0;

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
                        <p className="text-[11px] text-text-muted">{b.user_email}</p>
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
                            <span>{pct}% proc.</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full flex">
                              <div className="bg-success h-full" style={{ width: `${successPct}%` }} />
                              <div className="bg-danger h-full" style={{ width: `${Math.round((b.failed_count / b.total_leads) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-mono ${b.failed_count > 0 ? "text-danger" : "text-text-muted"}`}>
                          {b.failed_count}
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

      {selected && (
        <DetailModal broadcast={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
