"use client";

import { AlertTriangle, RefreshCw, Layers, Zap, Loader2, Clock, RotateCcw } from "lucide-react";

const QUEUES = [
  { name: "critical", size: 3, processing: 2, failed: 0, scheduled: 0, priority: 6, color: "danger" },
  { name: "default", size: 12, processing: 5, failed: 1, scheduled: 4, priority: 3, color: "primary" },
  { name: "broadcast", size: 450, processing: 150, failed: 2, scheduled: 0, priority: 1, color: "secondary" },
  { name: "tracking", size: 8, processing: 3, failed: 0, scheduled: 0, priority: 3, color: "success" },
];

const FAILED_TASKS = [
  { id: "t1", task_type: "flow:execution", lead_id: "a1b2c3d4", error: "lead not found: record not found", failed_at: "2026-05-20T22:14:02Z" },
  { id: "t2", task_type: "broadcast:lead_start", lead_id: "e5f6g7h8", error: "semaphore timeout broadcast user xyz", failed_at: "2026-05-20T21:55:18Z" },
  { id: "t3", task_type: "tracking:dispatch", lead_id: "i9j0k1l2", error: "meta CAPI 429: rate limit exceeded", failed_at: "2026-05-20T21:30:44Z" },
];

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/20" },
  danger: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/20" },
};

export default function AdminFilasPage() {
  const totalFailed = QUEUES.reduce((s, q) => s + q.failed, 0);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Filas Asynq</h1>
          </div>
          <p className="text-[12px] text-text-muted">Monitor de processamento de tarefas</p>
        </div>
        <button className="flex items-center gap-1.5 text-[11px] text-text-muted border border-border-subtle px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed">
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Mock banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-400/25 bg-yellow-400/5">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
        <p className="text-[11px] text-yellow-400">
          <span className="font-semibold">Dados mockados</span> — backend em desenvolvimento. Os valores abaixo são ilustrativos.
        </p>
      </div>

      {/* Queue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUEUES.map((q) => {
          const c = COLOR_CLASSES[q.color];
          return (
            <div
              key={q.name}
              className={`rounded-xl border p-4 ${c.border} ${c.bg.replace("/10", "/5")}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${c.text}`}>{q.name}</span>
                  {q.failed > 0 && (
                    <span className="w-4 h-4 rounded-full bg-danger flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">{q.failed}</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-text-muted font-mono">p={q.priority}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <p className={`text-lg font-bold font-mono ${c.text}`}>{q.size}</p>
                  <p className="text-[9px] text-text-muted">Em fila</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-primary">{q.processing}</p>
                  <p className="text-[9px] text-text-muted">Processando</p>
                </div>
                <div>
                  <p className={`text-sm font-bold font-mono ${q.failed > 0 ? "text-danger" : "text-text-muted"}`}>
                    {q.failed}
                  </p>
                  <p className="text-[9px] text-text-muted">Falhou</p>
                </div>
                <div>
                  <p className="text-sm font-bold font-mono text-text-muted">{q.scheduled}</p>
                  <p className="text-[9px] text-text-muted">Agendado</p>
                </div>
              </div>

              {/* Processing bar */}
              {q.size > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.bg.replace("/10", "")}`}
                      style={{ width: `${Math.min((q.processing / q.size) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Failed tasks */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
          <AlertTriangle className="w-4 h-4 text-danger" />
          <h3 className="text-sm font-semibold text-text-primary">Tasks com Falha</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger">
            {totalFailed}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">TASK TYPE</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">LEAD ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">ERRO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">HORÁRIO</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {FAILED_TASKS.map((task) => (
                <tr key={task.id} className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-mono text-danger">{task.task_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-text-muted">{task.lead_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-text-secondary truncate max-w-[260px] block">
                      {task.error}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-text-muted">{formatTime(task.failed_at)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      className="flex items-center gap-1 text-[10px] text-text-muted border border-border-subtle hover:border-primary/30 hover:text-primary px-2 py-1 rounded-lg transition-colors ml-auto opacity-50 cursor-not-allowed"
                      disabled
                      title="Backend em desenvolvimento"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
