"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Landmark, CheckCircle2, XCircle, Edit2, Trash2,
  X, RefreshCw, Eye, EyeOff, TrendingUp, DollarSign,
  ShoppingCart, Percent, Calendar,
} from "lucide-react";

// ─── Gateway definitions ──────────────────────────────────────────────────────

interface GatewayDef {
  type: string;
  label: string;
  apiKeyLabel: string;
  secretKeyLabel?: string;
  hasAccountId?: boolean; // gateways que precisam de account_id para split
}

const GATEWAYS: GatewayDef[] = [
  { type: "pushinpay",  label: "PushinPay",  apiKeyLabel: "Token",        hasAccountId: true },
  { type: "wiinpay",   label: "WiinPay",    apiKeyLabel: "API Key" },
  { type: "oasyfy",    label: "Oasyfy",     apiKeyLabel: "Public Key",   secretKeyLabel: "Secret Key" },
  { type: "syncpay",   label: "SyncPay",    apiKeyLabel: "Client ID",    secretKeyLabel: "Client Secret" },
  { type: "pixgate",   label: "PixGate",    apiKeyLabel: "Public Key",   secretKeyLabel: "Secret Key" },
  { type: "paradise",  label: "Paradise",   apiKeyLabel: "API Key",      secretKeyLabel: "Product Hash" },
  { type: "cnpay",     label: "CNPay",      apiKeyLabel: "Public Key",   secretKeyLabel: "Secret Key" },
  { type: "nexuspay",  label: "NexusPay",   apiKeyLabel: "API Key" },
];

const GATEWAY_LABELS: Record<string, string> = Object.fromEntries(
  GATEWAYS.map((g) => [g.type, g.label])
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformGateway {
  id: string;
  gateway_type: string;
  nickname: string;
  is_active: boolean;
  has_api_key: boolean;
  has_secret_key: boolean;
  has_account_id: boolean;
  split_pct: number;
  split_type: string;   // "percentage" | "fixed"
  split_value: number;  // R$ fixo quando split_type="fixed"
  created_at: string;
  updated_at: string;
}

interface GatewayRevenue {
  provider: string;
  count: number;
  volume: number;
  split_type: string;
  split_pct: number;
  split_value: number;
  split_revenue: number;
}

interface SplitRevenueResponse {
  from: string;
  to: string;
  gateways: GatewayRevenue[];
  total_count: number;
  total_volume: number;
  total_split_revenue: number;
}

// ─── Period presets ───────────────────────────────────────────────────────────

type PeriodPreset = "hoje" | "ontem" | "7dias" | "mes" | "mes_passado" | "total" | "custom";

function getPeriodDates(preset: PeriodPreset, customFrom?: string, customTo?: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "hoje") {
    const t = fmt(now);
    return { from: t, to: t };
  }
  if (preset === "ontem") {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    const t = fmt(d);
    return { from: t, to: t };
  }
  if (preset === "7dias") {
    const d = new Date(now); d.setDate(d.getDate() - 6);
    return { from: fmt(d), to: fmt(now) };
  }
  if (preset === "mes") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(from), to: fmt(now) };
  }
  if (preset === "mes_passado") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(from), to: fmt(to) };
  }
  if (preset === "total") {
    return { from: "2024-01-01", to: fmt(now) };
  }
  return { from: customFrom ?? fmt(now), to: customTo ?? fmt(now) };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Gateway Modal ────────────────────────────────────────────────────────────

function GatewayModal({
  def,
  existing,
  onClose,
  onSaved,
}: {
  def: GatewayDef;
  existing?: PlatformGateway;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(existing?.nickname ?? "");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [splitType, setSplitType] = useState<"percentage" | "fixed">(
    (existing?.split_type as "percentage" | "fixed") ?? "percentage"
  );
  const [splitPct, setSplitPct] = useState<string>(String(existing?.split_pct ?? 0));
  const [splitValue, setSplitValue] = useState<string>(String(existing?.split_value ?? 0));
  const [showApi, setShowApi] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showAccountId, setShowAccountId] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!existing && !apiKey.trim()) {
      toast.error(`${def.apiKeyLabel} é obrigatório.`);
      return;
    }
    if (splitType === "percentage") {
      const pct = parseFloat(splitPct);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        toast.error("Percentual de split deve ser entre 0 e 100.");
        return;
      }
    } else {
      const val = parseFloat(splitValue);
      if (isNaN(val) || val < 0) {
        toast.error("Valor fixo de split não pode ser negativo.");
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nickname,
        is_active: isActive,
        split_type: splitType,
        split_pct: splitType === "percentage" ? parseFloat(splitPct) : 0,
        split_value: splitType === "fixed" ? parseFloat(splitValue) : 0,
      };
      if (apiKey.trim()) body.api_key = apiKey.trim();
      if (secretKey.trim()) body.secret_key = secretKey.trim();
      if (accountId.trim()) body.account_id = accountId.trim();

      await apiFetch(`/api/v1/admin/gateways/${def.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast.success("Gateway salvo com sucesso.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const previewAmount = 100;
  const splitPreview = splitType === "percentage"
    ? previewAmount * parseFloat(splitPct || "0") / 100
    : parseFloat(splitValue || "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-secondary/30 bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-secondary/5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {existing ? "Editar" : "Configurar"} {def.label}
            </h2>
            <p className="text-[11px] text-text-muted">Conta da plataforma para receber split</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nickname */}
          <div>
            <label className="text-[11px] text-text-muted block mb-1">Apelido (identificação interna)</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={`ex: Conta principal ${def.label}`}
              className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-[11px] text-text-muted block mb-1">
              {def.apiKeyLabel}
              {existing?.has_api_key && <span className="ml-2 text-success">● configurado</span>}
            </label>
            <div className="relative">
              <input
                type={showApi ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={existing?.has_api_key ? "Deixe em branco para manter o atual" : `Cole seu ${def.apiKeyLabel}`}
                className="w-full bg-surface border border-border-subtle rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
              />
              <button type="button" onClick={() => setShowApi((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showApi ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          {def.secretKeyLabel && (
            <div>
              <label className="text-[11px] text-text-muted block mb-1">
                {def.secretKeyLabel}
                {existing?.has_secret_key && <span className="ml-2 text-success">● configurado</span>}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={existing?.has_secret_key ? "Deixe em branco para manter o atual" : `Cole seu ${def.secretKeyLabel}`}
                  className="w-full bg-surface border border-border-subtle rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
                />
                <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Account ID — obrigatório para PushinPay split */}
          {def.hasAccountId && (
            <div>
              <label className="text-[11px] text-text-muted block mb-1">
                Account ID da plataforma
                {existing?.has_account_id
                  ? <span className="ml-2 text-success">● configurado</span>
                  : <span className="ml-2 text-danger">● necessário para split</span>
                }
              </label>
              <div className="relative">
                <input
                  type={showAccountId ? "text" : "password"}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder={existing?.has_account_id ? "Deixe em branco para manter o atual" : "ex: 9C3XXXXX3A043"}
                  className="w-full bg-surface border border-border-subtle rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
                />
                <button type="button" onClick={() => setShowAccountId((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showAccountId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                ID da conta {def.label} da plataforma — destino do split. Encontrado no painel do gateway.
              </p>
            </div>
          )}

          {/* Split type toggle */}
          <div>
            <label className="text-[11px] text-text-muted block mb-2">Tipo de split que você recebe</label>
            <div className="flex rounded-lg overflow-hidden border border-border-subtle">
              <button
                type="button"
                onClick={() => setSplitType("percentage")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  splitType === "percentage"
                    ? "bg-primary/15 text-primary border-r border-primary/30"
                    : "text-text-muted hover:bg-white/5 border-r border-border-subtle"
                }`}
              >
                <Percent className="w-3 h-3" />
                Percentual
              </button>
              <button
                type="button"
                onClick={() => setSplitType("fixed")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  splitType === "fixed"
                    ? "bg-primary/15 text-primary"
                    : "text-text-muted hover:bg-white/5"
                }`}
              >
                <DollarSign className="w-3 h-3" />
                Fixo (R$)
              </button>
            </div>
          </div>

          {/* Split value input */}
          {splitType === "percentage" ? (
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Percentual (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={splitPct}
                  onChange={(e) => setSplitPct(e.target.value)}
                  placeholder="ex: 10"
                  className="w-full bg-surface border border-border-subtle rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
                />
                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Valor fixo por transação (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={splitValue}
                  onChange={(e) => setSplitValue(e.target.value)}
                  placeholder="ex: 5.00"
                  className="w-full bg-surface border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary/40"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {splitPreview > 0 && (
            <p className="text-[10px] text-text-muted">
              {splitType === "percentage"
                ? `Em uma venda de R$ 100,00 você recebe `
                : `Por transação você recebe `}
              <span className="text-success font-medium">{fmtBRL(splitPreview)}</span>
              {splitType === "percentage" && ` · Em R$ 500,00 = `}
              {splitType === "percentage" && (
                <span className="text-success font-medium">{fmtBRL(500 * parseFloat(splitPct || "0") / 100)}</span>
              )}
            </p>
          )}

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isActive ? "bg-success" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-text-secondary">Ativo para receber split</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border-subtle text-sm text-text-muted hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Split Revenue Section ────────────────────────────────────────────────────

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "hoje",        label: "Hoje" },
  { key: "ontem",       label: "Ontem" },
  { key: "7dias",       label: "7 dias" },
  { key: "mes",         label: "Este mês" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "total",       label: "Total" },
  { key: "custom",      label: "Personalizado" },
];

function SplitRevenueSection() {
  const [preset, setPreset] = useState<PeriodPreset>("mes");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<SplitRevenueResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRevenue = useCallback(async (p: PeriodPreset, cf?: string, ct?: string) => {
    const { from, to } = getPeriodDates(p, cf, ct);
    if (p === "custom" && (!cf || !ct)) return;
    setLoading(true);
    try {
      const res = await apiFetch<SplitRevenueResponse>(
        `/api/v1/admin/split-revenue?from=${from}&to=${to}`
      );
      setData(res);
    } catch {
      toast.error("Erro ao carregar receita de split.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preset !== "custom") fetchRevenue(preset);
  }, [preset, fetchRevenue]);

  const handleCustomApply = () => {
    if (!customFrom || !customTo) { toast.error("Informe as datas de início e fim."); return; }
    fetchRevenue("custom", customFrom, customTo);
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-text-primary">Receita de Split</h2>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              preset === p.key
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-surface border-border-subtle text-text-muted hover:border-primary/30 hover:text-text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3 bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <div>
            <label className="text-[10px] text-text-muted block mb-1">De</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-muted block mb-1">Até</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary/40"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary/15 border border-primary/40 text-primary text-[11px] font-medium hover:bg-primary/25 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Aplicar
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total de transações */}
        <div className="bg-surface border border-border-subtle rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Transações pagas</p>
            {loading ? (
              <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-text-primary">{(data?.total_count ?? 0).toLocaleString("pt-BR")}</p>
            )}
          </div>
        </div>

        {/* Volume total */}
        <div className="bg-surface border border-border-subtle rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Volume total processado</p>
            {loading ? (
              <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-text-primary">{fmtBRL(data?.total_volume ?? 0)}</p>
            )}
          </div>
        </div>

        {/* Receita de split */}
        <div className="bg-surface border border-success/25 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Sua receita de split</p>
            {loading ? (
              <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-success">{fmtBRL(data?.total_split_revenue ?? 0)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Per-gateway breakdown */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle">
          <p className="text-[11px] font-semibold text-text-muted tracking-wider">DETALHAMENTO POR GATEWAY</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-text-muted tracking-wider">GATEWAY</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-text-muted tracking-wider">TRANSAÇÕES</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-text-muted tracking-wider">VOLUME</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-text-muted tracking-wider">SPLIT</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-text-muted tracking-wider">SUA RECEITA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle/50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-3 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data || data.gateways.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">
                    Nenhuma transação paga no período.
                  </td>
                </tr>
              ) : (
                data.gateways.map((g) => (
                  <tr key={g.provider} className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="text-xs font-medium text-text-primary">
                          {GATEWAY_LABELS[g.provider] ?? g.provider}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-text-secondary">{g.count.toLocaleString("pt-BR")}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-text-secondary">{fmtBRL(g.volume)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {g.split_type === "fixed" ? (
                        <span className={`text-xs font-medium ${g.split_value > 0 ? "text-primary" : "text-text-muted"}`}>
                          {g.split_value > 0 ? fmtBRL(g.split_value) : "—"}
                        </span>
                      ) : (
                        <span className={`text-xs font-medium ${g.split_pct > 0 ? "text-primary" : "text-text-muted"}`}>
                          {g.split_pct > 0 ? `${g.split_pct}%` : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-bold ${g.split_revenue > 0 ? "text-success" : "text-text-muted"}`}>
                        {fmtBRL(g.split_revenue)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data && data.gateways.length > 0 && !loading && (
              <tfoot>
                <tr className="bg-white/2">
                  <td className="px-5 py-3 text-[11px] font-semibold text-text-muted">TOTAL</td>
                  <td className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary">
                    {data.total_count.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] font-semibold text-text-secondary">
                    {fmtBRL(data.total_volume)}
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] text-text-muted">—</td>
                  <td className="px-5 py-3 text-right text-[11px] font-bold text-success">
                    {fmtBRL(data.total_split_revenue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGatewaysPage() {
  const [accounts, setAccounts] = useState<PlatformGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDef, setModalDef] = useState<GatewayDef | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PlatformGateway[]>("/api/v1/admin/gateways");
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const getAccount = (type: string) => accounts.find((a) => a.gateway_type === type);

  const handleDelete = async (type: string) => {
    if (!confirm(`Remover conta ${type} da plataforma?`)) return;
    setDeleting(type);
    try {
      await apiFetch(`/api/v1/admin/gateways/${type}`, { method: "DELETE" });
      toast.success("Gateway removido.");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover.");
    } finally {
      setDeleting(null);
    }
  };

  const configured = accounts.filter((a) => a.is_active).length;

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-8">
      {/* ── Gateways section ── */}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-5 h-5 text-secondary" />
              <h1 className="text-lg font-bold text-text-primary">Gateways da Plataforma</h1>
              <span className="text-[11px] font-mono text-text-muted">({configured} ativos)</span>
            </div>
            <p className="text-[12px] text-text-muted">
              Contas da plataforma para receber split por gateway. Configure o percentual em cada gateway.
            </p>
          </div>
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* Gateway cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? GATEWAYS.map((_, i) => (
                <div key={i} className="rounded-xl border border-border-subtle bg-surface p-5">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-3" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              ))
            : GATEWAYS.map((def) => {
                const acc = getAccount(def.type);
                const isConfigured = !!acc;
                const isActive = acc?.is_active ?? false;

                return (
                  <div
                    key={def.type}
                    className={`rounded-xl border bg-surface p-4 flex flex-col gap-3 transition-colors ${
                      isActive
                        ? "border-success/30 bg-success/3"
                        : isConfigured
                        ? "border-border-subtle"
                        : "border-border-subtle opacity-70"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className={`w-4 h-4 ${isActive ? "text-success" : "text-text-muted"}`} />
                        <span className="text-sm font-semibold text-text-primary">{def.label}</span>
                      </div>
                      {isConfigured ? (
                        isActive ? (
                          <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                            <div className="w-1 h-1 rounded-full bg-success" /> Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                            Inativo
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-text-muted">Não configurado</span>
                      )}
                    </div>

                    {/* Credential status + split info */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        {acc?.has_api_key ? (
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        ) : (
                          <XCircle className="w-3 h-3 text-text-muted" />
                        )}
                        <span className="text-[11px] text-text-muted">{def.apiKeyLabel}</span>
                      </div>
                      {def.secretKeyLabel && (
                        <div className="flex items-center gap-1.5">
                          {acc?.has_secret_key ? (
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          ) : (
                            <XCircle className="w-3 h-3 text-text-muted" />
                          )}
                          <span className="text-[11px] text-text-muted">{def.secretKeyLabel}</span>
                        </div>
                      )}
                      {def.hasAccountId && (
                        <div className="flex items-center gap-1.5">
                          {acc?.has_account_id ? (
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          ) : (
                            <XCircle className="w-3 h-3 text-danger" />
                          )}
                          <span className={`text-[11px] ${acc?.has_account_id ? "text-text-muted" : "text-danger"}`}>
                            Account ID {acc?.has_account_id ? "" : "(faltando!)"}
                          </span>
                        </div>
                      )}
                      {isConfigured && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {acc?.split_type === "fixed" ? (
                            <>
                              <DollarSign className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-[11px] text-primary font-medium">
                                {fmtBRL(acc?.split_value ?? 0)} fixo/tx
                              </span>
                            </>
                          ) : (
                            <>
                              <Percent className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-[11px] text-primary font-medium">
                                {acc?.split_pct ?? 0}% split
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {acc?.nickname && (
                        <p className="text-[10px] text-text-muted truncate">"{acc.nickname}"</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-1">
                      <button
                        onClick={() => setModalDef(def)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] border border-border-subtle hover:border-secondary/40 hover:text-secondary text-text-muted px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        {isConfigured ? "Editar" : "Configurar"}
                      </button>
                      {isConfigured && (
                        <button
                          onClick={() => handleDelete(def.type)}
                          disabled={deleting === def.type}
                          className="flex items-center justify-center gap-1.5 text-[11px] border border-border-subtle hover:border-danger/40 hover:text-danger text-text-muted px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-border-subtle" />

      {/* ── Split Revenue section ── */}
      <SplitRevenueSection />

      {/* Modal */}
      {modalDef && (
        <GatewayModal
          def={modalDef}
          existing={getAccount(modalDef.type)}
          onClose={() => setModalDef(null)}
          onSaved={fetchAccounts}
        />
      )}
    </div>
  );
}
