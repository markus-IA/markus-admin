"use client";

import { useState } from "react";
import { AdminDuplicate } from "@/types";
import { AlertTriangle, Copy, Filter, X } from "lucide-react";

const DUPLICATES: AdminDuplicate[] = [
  {
    lead_id: "l1a2b3",
    lead_name: "Carlos Mendes",
    bot_name: "VIP Bot",
    content: "Olá! Bem-vindo ao grupo exclusivo. Clique no link abaixo para garantir seu acesso.",
    count: 3,
    first_at: "2026-05-20T10:00:00Z",
    last_at: "2026-05-20T10:04:22Z",
    origin: "flow",
  },
  {
    lead_id: "l4e5f6",
    lead_name: "Ana Paula",
    bot_name: "Presell Bot",
    content: "Aqui está seu PIX: 00020126580014br.gov.bcb.pix0136...",
    count: 4,
    first_at: "2026-05-20T08:30:00Z",
    last_at: "2026-05-20T08:32:01Z",
    origin: "broadcast",
  },
  {
    lead_id: "l7g8h9",
    lead_name: "João Victor",
    bot_name: "AI Sales Bot",
    content: "Desculpe, tive uma instabilidade momentânea. Poderia repetir?",
    count: 6,
    first_at: "2026-05-19T22:10:00Z",
    last_at: "2026-05-19T22:12:45Z",
    origin: "ai",
  },
  {
    lead_id: "l0i1j2",
    lead_name: "Fernanda Lima",
    bot_name: "Checkout Bot",
    content: "Seu pagamento foi confirmado! 🎉 Acesse seu conteúdo aqui:",
    count: 2,
    first_at: "2026-05-19T15:00:00Z",
    last_at: "2026-05-19T15:01:10Z",
    origin: "flow",
  },
  {
    lead_id: "l3k4l5",
    lead_name: "Pedro Alves",
    bot_name: "Suporte Bot",
    content: "Olá Pedro! Como posso te ajudar hoje?",
    count: 2,
    first_at: "2026-05-18T11:00:00Z",
    last_at: "2026-05-18T11:00:05Z",
    origin: "manual",
  },
];

const ORIGIN_LABELS: Record<string, { label: string; color: string }> = {
  flow: { label: "Fluxo", color: "text-primary" },
  broadcast: { label: "Disparo", color: "text-secondary" },
  ai: { label: "IA", color: "text-yellow-400" },
  manual: { label: "Manual", color: "text-text-muted" },
};

const ORIGINS = ["Todos", "flow", "broadcast", "ai", "manual"] as const;
type Origin = (typeof ORIGINS)[number];

export default function AdminDuplicatasPage() {
  const [filterOrigin, setFilterOrigin] = useState<Origin>("Todos");

  const filtered = DUPLICATES.filter(
    (d) => filterOrigin === "Todos" || d.origin === filterOrigin
  );

  const today = DUPLICATES.filter((d) => {
    const dt = new Date(d.last_at);
    const now = new Date();
    return dt.toDateString() === now.toDateString();
  });

  const thisWeek = DUPLICATES.filter((d) => {
    const dt = new Date(d.last_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return dt >= weekAgo;
  });

  const affectedLeads = new Set(DUPLICATES.map((d) => d.lead_id)).size;

  const windowStr = (d: AdminDuplicate) => {
    const first = new Date(d.first_at);
    const last = new Date(d.last_at);
    const diffMs = last.getTime() - first.getTime();
    const diffSec = Math.round(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}min`;
    return `${Math.round(diffSec / 3600)}h`;
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Copy className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Duplicatas</h1>
          </div>
          <p className="text-[12px] text-text-muted">Detector de mensagens enviadas repetidamente</p>
        </div>
      </div>

      {/* Mock banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-400/25 bg-yellow-400/5">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <p className="text-[11px] text-yellow-400">
          <span className="font-semibold">Dados mockados</span> — query de detecção de duplicatas em desenvolvimento no backend.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Duplicatas hoje", value: today.length, color: "danger" },
          { label: "Esta semana", value: thisWeek.length, color: "secondary" },
          { label: "Leads afetados", value: affectedLeads, color: "primary" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-4 ${
              kpi.color === "danger"
                ? "border-danger/20 bg-danger/5"
                : kpi.color === "secondary"
                ? "border-secondary/20 bg-secondary/5"
                : "border-primary/20 bg-primary/5"
            }`}
          >
            <p
              className={`text-2xl font-bold font-mono ${
                kpi.color === "danger"
                  ? "text-danger"
                  : kpi.color === "secondary"
                  ? "text-secondary"
                  : "text-primary"
              }`}
            >
              {kpi.value}
            </p>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-text-muted text-sm">
                    Nenhuma duplicata encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const orig = ORIGIN_LABELS[d.origin];
                  return (
                    <tr key={d.lead_id} className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-text-primary">{d.lead_name}</p>
                        <p className="text-[10px] font-mono text-text-muted">{d.lead_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-secondary">{d.bot_name}</span>
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
