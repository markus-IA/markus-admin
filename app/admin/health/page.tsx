"use client";

import { useState, useEffect } from "react";
import { HeartPulse, RefreshCw, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Cpu, Zap, Send } from "lucide-react";

interface HealthResponse {
  status: string;
  db: string;
  redis: string;
}

const WORKERS = [
  {
    name: "markus-worker-core",
    role: "core",
    concurrency: 50,
    queues: "critical(6) + default(3)",
    icon: Cpu,
    uptime: "3d 14h 22m",
    tasks_processed: 48320,
    memory_mb: 128,
  },
  {
    name: "markus-worker-broadcast",
    role: "broadcast",
    concurrency: 150,
    queues: "broadcast(1)",
    icon: Send,
    uptime: "3d 14h 22m",
    tasks_processed: 182450,
    memory_mb: 256,
  },
  {
    name: "markus-worker-tracking",
    role: "tracking",
    concurrency: 20,
    queues: "tracking(3)",
    icon: Zap,
    uptime: "3d 14h 22m",
    tasks_processed: 21880,
    memory_mb: 64,
  },
];

function StatusIndicator({ label, status, loading }: { label: string; status: string; loading: boolean }) {
  const isOk = status === "ok" || status === "connected" || status === "up";

  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${
      loading
        ? "border-border-subtle bg-surface"
        : isOk
        ? "border-success/25 bg-success/5"
        : "border-danger/25 bg-danger/5"
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        loading ? "bg-white/5" : isOk ? "bg-success/15" : "bg-danger/15"
      }`}>
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
        ) : isOk ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <XCircle className="w-5 h-5 text-danger" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {loading ? (
          <div className="h-3 w-16 bg-white/5 rounded animate-pulse mt-1" />
        ) : (
          <p className={`text-[11px] font-mono mt-0.5 ${isOk ? "text-success" : "text-danger"}`}>
            {isOk ? "ONLINE" : "OFFLINE"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.markus.business/health");
      const data: HealthResponse = await res.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch {
      setHealth({ status: "error", db: "error", redis: "error" });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">System Health</h1>
          </div>
          <p className="text-[12px] text-text-muted">
            {lastChecked
              ? `Última verificação: ${lastChecked.toLocaleTimeString("pt-BR")} — atualiza a cada 30s`
              : "Verificando..."}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Verificar
        </button>
      </div>

      {/* Core services */}
      <div>
        <h2 className="text-[11px] font-semibold text-text-muted tracking-wider mb-3">SERVIÇOS PRINCIPAIS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusIndicator
            label="API REST"
            status={health?.status || ""}
            loading={loading}
          />
          <StatusIndicator
            label="Database (Postgres)"
            status={health?.db || ""}
            loading={loading}
          />
          <StatusIndicator
            label="Redis / Asynq"
            status={health?.redis || ""}
            loading={loading}
          />
        </div>
      </div>

      {/* Workers (mock) */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] font-semibold text-text-muted tracking-wider">WORKERS</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-[9px] text-yellow-400 font-mono">MOCK</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKERS.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.name}
                className="rounded-xl border border-success/20 bg-success/5 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-semibold text-text-primary truncate max-w-[120px]">
                        {w.name}
                      </p>
                      <p className="text-[9px] text-success">ONLINE</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className="text-text-muted">Concorrência</p>
                    <p className="font-mono text-primary">{w.concurrency} threads</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Uptime</p>
                    <p className="font-mono text-text-primary">{w.uptime}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Tasks proc.</p>
                    <p className="font-mono text-text-primary">{w.tasks_processed.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Memória</p>
                    <p className="font-mono text-text-primary">{w.memory_mb} MB</p>
                  </div>
                </div>

                <div className="text-[9px] text-text-muted font-mono border-t border-border-subtle pt-2">
                  {w.queues}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentry */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Monitoramento de Erros</h3>
            <p className="text-[11px] text-text-muted">
              Erros de runtime e exceções são monitorados via Sentry. Abra o painel para ver os últimos eventos.
            </p>
          </div>
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-secondary border border-secondary/30 hover:bg-secondary/10 px-4 py-2 rounded-lg transition-colors shrink-0 ml-4"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Sentry
          </a>
        </div>
      </div>
    </div>
  );
}
