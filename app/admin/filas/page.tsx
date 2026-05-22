"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Layers, RotateCcw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";

interface QueueInfo {
  name: string;
  size: number;
  processing: number;
  failed: number;
  scheduled: number;
}

interface FailedTask {
  id: string;
  task_type: string;
  queue: string;
  error: string;
  failed_at: string;
  payload: string;
}

const QUEUE_META: Record<string, { priority: number; color: string }> = {
  critical:       { priority: 6, color: "danger" },
  default:        { priority: 3, color: "primary" },
  broadcast:      { priority: 1, color: "secondary" },
  broadcast_flow: { priority: 1, color: "secondary" },
  tracking:       { priority: 3, color: "success" },
};

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string }> = {
  primary:   { text: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20" },
  secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  success:   { text: "text-success",   bg: "bg-success/10",   border: "border-success/20" },
  danger:    { text: "text-danger",    bg: "bg-danger/10",    border: "border-danger/20" },
};

export default function AdminFilasPage() {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [failedTasks, setFailedTasks] = useState<FailedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [q, f] = await Promise.all([
        apiFetch<QueueInfo[]>("/api/v1/admin/queues"),
        apiFetch<FailedTask[]>("/api/v1/admin/queues/failed"),
      ]);
      setQueues(q);
      setFailedTasks(f);
    } catch {
      setError("Erro ao carregar dados das filas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRetry = async (queue: string, taskId: string) => {
    setRetrying(taskId);
    try {
      await apiFetch(`/api/v1/admin/queues/${queue}/tasks/${taskId}/retry`, { method: "POST" });
      toast.success("Task reenfileirada.");
      fetchData(true);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao retentar task.");
    } finally {
      setRetrying(null);
    }
  };

  const handlePurge = async () => {
    if (!confirm("Apagar todas as tasks com falha de todas as filas?")) return;
    setPurging(true);
    try {
      const res = await apiFetch<{ deleted: number }>("/api/v1/admin/queues/purge", { method: "POST" });
      toast.success(`${res.deleted} task(s) removida(s).`);
      await fetchData(true);
    } catch {
      toast.error("Erro ao limpar dead queue.");
    } finally {
      setPurging(false);
    }
  };

  const totalFailed = queues.reduce((s, q) => s + q.failed, 0);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

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
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 text-[11px] text-text-muted border border-border-subtle px-3 py-1.5 rounded-lg hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-danger/25 bg-danger/5">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <p className="text-[11px] text-danger">{error}</p>
        </div>
      )}

      {/* Queue cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-surface p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {queues.map((q) => {
            const meta = QUEUE_META[q.name] || { priority: 1, color: "primary" };
            const c = COLOR_CLASSES[meta.color];
            return (
              <div key={q.name} className={`rounded-xl border p-4 ${c.border} ${c.bg.replace("/10", "/5")}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${c.text}`}>{q.name}</span>
                    {q.failed > 0 && (
                      <span className="w-4 h-4 rounded-full bg-danger flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{q.failed > 9 ? "9+" : q.failed}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-text-muted font-mono">p={meta.priority}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <p className={`text-lg font-bold font-mono ${c.text}`}>{q.size.toLocaleString("pt-BR")}</p>
                    <p className="text-[9px] text-text-muted">Em fila</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono text-primary">{q.processing}</p>
                    <p className="text-[9px] text-text-muted">Processando</p>
                  </div>
                  <div>
                    <p className={`text-sm font-bold font-mono ${q.failed > 0 ? "text-danger" : "text-text-muted"}`}>
                      {q.failed.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[9px] text-text-muted">Falhou</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-mono text-text-muted">{q.scheduled}</p>
                    <p className="text-[9px] text-text-muted">Agendado</p>
                  </div>
                </div>

                {q.size > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.bg}`}
                        style={{ width: `${Math.min((q.processing / q.size) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Failed tasks table */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-text-primary">Tasks com Falha</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger">
              {totalFailed.toLocaleString("pt-BR")}
            </span>
          </div>
          {totalFailed > 0 && (
            <button
              onClick={handlePurge}
              disabled={purging}
              className="flex items-center gap-1.5 text-[11px] text-danger border border-danger/30 hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {purging ? "Limpando..." : "Limpar tudo"}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">TASK TYPE</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">FILA</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">ERRO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">HORÁRIO</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted text-sm">Carregando...</td>
                </tr>
              ) : failedTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted text-sm">Nenhuma task com falha.</td>
                </tr>
              ) : (
                failedTasks.map((task) => (
                  <tr key={task.id} className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-mono text-danger">{task.task_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-text-muted">{task.queue}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-text-secondary truncate max-w-[280px] block" title={task.error}>
                        {task.error}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-text-muted">{formatTime(task.failed_at)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleRetry(task.queue, task.id)}
                        disabled={retrying === task.id}
                        className="flex items-center gap-1 text-[10px] text-text-muted border border-border-subtle hover:border-primary/30 hover:text-primary px-2 py-1 rounded-lg transition-colors ml-auto disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3 h-3 ${retrying === task.id ? "animate-spin" : ""}`} />
                        {retrying === task.id ? "..." : "Retry"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
