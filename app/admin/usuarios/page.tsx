"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { AdminUser } from "@/types";
import toast from "react-hot-toast";
import {
  Search, Filter, Shield, Users, CheckCircle2, XCircle,
  ChevronDown, Calendar, X, Edit2, UserCheck, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditPlanForm {
  plan: string;
  expires_at: string;
  leads_limit: number;
  is_active: boolean;
  is_approved: boolean;
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  FREE: "text-text-muted bg-white/5 border-white/10",
  STARTER: "text-primary bg-primary/10 border-primary/20",
  PRO: "text-secondary bg-secondary/10 border-secondary/20",
  ENTERPRISE: "text-success bg-success/10 border-success/20",
};

// ─── Modal ───────────────────────────────────────────────────────────────────

function EditPlanModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditPlanForm>({
    plan: user.plan,
    expires_at: user.plan_expires_at
      ? user.plan_expires_at.slice(0, 10)
      : "",
    leads_limit: user.leads_limit,
    is_active: user.is_active,
    is_approved: user.is_approved,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: form.plan,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          leads_limit: Number(form.leads_limit),
          is_active: form.is_active,
          is_approved: form.is_approved,
        }),
      });
      toast.success("Plano atualizado com sucesso.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-secondary/30 bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-secondary/5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Editar Plano</h2>
            <p className="text-[11px] text-text-muted">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Plan select */}
          <div>
            <label className="text-[11px] text-text-muted mb-1.5 block">Plano</label>
            <select
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-secondary/50"
            >
              <option value="FREE">FREE</option>
              <option value="STARTER">STARTER</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>

          {/* Expires at */}
          <div>
            <label className="text-[11px] text-text-muted mb-1.5 block">Data de Expiração</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-secondary/50"
            />
          </div>

          {/* Leads limit */}
          <div>
            <label className="text-[11px] text-text-muted mb-1.5 block">Limite de Leads</label>
            <input
              type="number"
              value={form.leads_limit}
              onChange={(e) => setForm((f) => ({ ...f, leads_limit: Number(e.target.value) }))}
              min={0}
              className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-secondary/50"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  form.is_active ? "bg-success" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.is_active ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-xs text-text-secondary">Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, is_approved: !f.is_approved }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  form.is_approved ? "bg-primary" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.is_approved ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-xs text-text-secondary">Aprovado</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border-subtle text-sm text-text-muted hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>("/api/v1/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (user: AdminUser) => {
    setTogglingId(user.id);
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      toast.success(user.is_active ? "Usuário desativado." : "Usuário ativado.");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleApprove = async (user: AdminUser) => {
    setApprovingId(user.id);
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: user.plan, is_approved: true }),
      });
      toast.success("Usuário aprovado!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao aprovar.");
    } finally {
      setApprovingId(null);
    }
  };

  // Client-side filtering
  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.name?.toLowerCase().includes(q) &&
        !u.email?.toLowerCase().includes(q)
      )
        return false;
    }
    if (filterPlan && u.plan !== filterPlan) return false;
    if (filterStatus === "active" && !u.is_active) return false;
    if (filterStatus === "inactive" && u.is_active) return false;
    if (filterStatus === "pending" && u.is_approved) return false;
    return true;
  });

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-secondary" />
            <h1 className="text-lg font-bold text-text-primary">Usuários</h1>
            <span className="text-[11px] font-mono text-text-muted">({users.length})</span>
          </div>
          <p className="text-[12px] text-text-muted">Gestão de contas e planos</p>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/40"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
        >
          <option value="">Todos os planos</option>
          <option value="FREE">FREE</option>
          <option value="STARTER">STARTER</option>
          <option value="PRO">PRO</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/40"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="pending">Pendente aprovação</option>
        </select>
        {(search || filterPlan || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterPlan(""); setFilterStatus(""); }}
            className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-danger px-3 py-2 border border-border-subtle rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/2">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">USUÁRIO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">EMAIL</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">PLANO</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">LEADS</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">STATUS</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted tracking-wider">CRIADO EM</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-text-muted tracking-wider">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border-subtle/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                        <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                      </div>
                    </td>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                    <td className="px-5 py-3"><div className="h-3 w-16 bg-white/5 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-text-muted text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const initials = (user.name || user.email || "?")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const createdDate = new Date(user.created_at).toLocaleDateString("pt-BR");

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border-subtle/50 hover:bg-white/2 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate max-w-[130px]">
                              {user.name || "—"}
                            </p>
                            {user.role === "admin" && (
                              <span className="text-[9px] text-secondary">admin</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-secondary truncate max-w-[200px] block">
                          {user.email || "—"}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            PLAN_STYLES[user.plan] || PLAN_STYLES.FREE
                          }`}
                        >
                          {user.plan}
                        </span>
                      </td>

                      {/* Leads */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-text-secondary">
                          {user.leads_limit.toLocaleString("pt-BR")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {!user.is_approved ? (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded">
                              Pendente
                            </span>
                          ) : user.is_active ? (
                            <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                              <div className="w-1 h-1 rounded-full bg-success" />
                              Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded">
                              Inativo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created at */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-muted">{createdDate}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve button */}
                          {!user.is_approved && (
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={approvingId === user.id}
                              className="flex items-center gap-1 text-[10px] text-primary border border-primary/30 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              Aprovar
                            </button>
                          )}

                          {/* Edit plan button */}
                          <button
                            onClick={() => setEditUser(user)}
                            className="flex items-center gap-1 text-[10px] text-text-muted border border-border-subtle hover:border-secondary/40 hover:text-secondary px-2 py-1 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggle(user)}
                            disabled={togglingId === user.id}
                            className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${
                              user.is_active ? "bg-success" : "bg-white/10"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                user.is_active ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-muted">
              {filtered.length} de {users.length} usuários
            </p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editUser && (
        <EditPlanModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
