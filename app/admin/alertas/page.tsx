"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Power, PowerOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SystemAlert {
  enabled: boolean;
  message: string;
  updated_at: number;
}

const DEFAULT_MESSAGE =
  "⚠️ Estamos trabalhando em melhorias do produto. Isso pode causar instabilidade no sistema de disparo em massa. Em instantes liberaremos essa função novamente.";

export default function AlertasPage() {
  const [alert, setAlert] = useState<SystemAlert>({ enabled: false, message: DEFAULT_MESSAGE, updated_at: 0 });
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/api/v1/admin/system-alert")
      .then((r) => r.json())
      .then((data: SystemAlert) => {
        setAlert(data);
        if (data.message) setMessage(data.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    setSaving(true);
    try {
      const res = await apiFetch("/api/v1/admin/system-alert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !alert.enabled, message }),
      });
      const data: SystemAlert = await res.json();
      setAlert(data);
      setMessage(data.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function saveMessage() {
    if (!alert.enabled) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/v1/admin/system-alert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: alert.enabled, message }),
      });
      const data: SystemAlert = await res.json();
      setAlert(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        <h1 className="text-xl font-bold text-white">Alertas do Sistema</h1>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border p-5 transition-colors ${
        alert.enabled
          ? "border-yellow-500/40 bg-yellow-500/5"
          : "border-border-subtle bg-surface"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {alert.enabled ? "Alerta ATIVO" : "Alerta desativado"}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {alert.enabled
                ? "Criação e início de disparos estão bloqueados para todos os usuários."
                : "Sistema funcionando normalmente."}
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              alert.enabled
                ? "bg-success/10 border border-success/30 text-success hover:bg-success/20"
                : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            }`}
          >
            {alert.enabled ? (
              <><Power className="w-4 h-4" /> Desativar</>
            ) : (
              <><PowerOff className="w-4 h-4" /> Ativar alerta</>
            )}
          </button>
        </div>
      </div>

      {/* Message editor */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5 space-y-3">
        <label className="text-sm font-medium text-text-primary block">
          Mensagem exibida aos usuários
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg bg-black/30 border border-border-subtle text-text-primary text-sm p-3 resize-none focus:outline-none focus:border-primary/50 placeholder:text-text-muted"
          placeholder="Mensagem de alerta..."
        />
        {alert.enabled && (
          <button
            onClick={saveMessage}
            disabled={saving || message === alert.message}
            className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            {saved ? <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Salvo</span> : "Atualizar mensagem"}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5 space-y-3">
        <p className="text-sm font-medium text-text-muted">Preview — como o usuário verá</p>
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-200 leading-relaxed">{message}</p>
        </div>
      </div>

      {alert.updated_at > 0 && (
        <p className="text-xs text-text-muted text-right">
          Última atualização: {new Date(alert.updated_at * 1000).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
