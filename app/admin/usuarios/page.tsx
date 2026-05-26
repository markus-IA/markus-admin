"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { AdminUser } from "@/types";
import toast from "react-hot-toast";
import {
  Search, Users, X, Edit2, RefreshCw, ShieldCheck, ShieldOff,
  CheckCircle, Clock, Zap, ZapOff,
} from "lucide-react";

interface EditUserForm {
  is_active: boolean;
  role: "admin" | "user";
}

function EditUserModal({
  user, onClose, onSaved,
}: {
  user: AdminUser; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<EditUserForm>({
    is_active: user.is_active,
    role: (user.role as "admin" | "user") ?? "user",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const calls: Promise<unknown>[] = [];
      if (form.is_active !== user.is_active) {
        calls.push(apiFetch(`/api/v1/admin/users/${user.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: form.is_active }),
        }));
      }
      if (form.role !== (user.role ?? "user")) {
        calls.push(apiFetch(`/api/v1/admin/users/${user.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: form.role }),
        }));
      }
      if (calls.length === 0) { onClose(); return; }
      await Promise.all(calls);
      toast.success("Usuário atualizado com sucesso.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = form.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-secondary/30 bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-secondary/5">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Editar Usuário</h2>
            <p className="text-[11px] text-text-muted">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-primary">Conta ativa</p>
              <p className="text-[11px] text-text-muted">Permite ou bloqueia o acesso do usuário</p>
            </div>
            <div
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${form.is_active ? "bg-success" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
          <div className="border-t border-border-subtle" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAdmin ? <ShieldCheck className="w-4 h-4 text-secondary shrink-0" /> : <ShieldOff className="w-4 h-4 text-text-muted shrink-0" />}
              <div>
                <p className="text-xs font-medium text-text-primary">Permissão admin</p>
                <p className="text-[11px] text-text-muted">Acesso ao painel administrativo</p>
              </div>
            </div>
            <div
              onClick={() => setForm((f) => ({ ...f, role: f.role === "admin" ? "user" : "admin" }))}
              className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${isAdmin ? "bg-secondary" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAdmin ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
          {isAdmin && (user.role ?? "user") !== "admin" && (
            <div className="flex items-start gap-2 bg-secondary/10 border border-secondary/25 rounded-lg px-3 py-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
              <p className="text-[11px] text-secondary leading-relaxed">
                Este usuário terá acesso completo ao painel admin, incluindo gestão de usuários e gateways.
              </p>
            </div>
          )}
        </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "todos" | "pendentes" | "ativos" | "inativos";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("todos");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState<boolean | null>(null);
  const [savingMode, setSavingMode] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminUser[]>("/api/v1/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      /* keep stale */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAutoApprove = useCallback(async () => {
    try {
      const data = await apiFetch<{ auto_approve: boolean }>("/api/v1/admin/settings/auto-approve");
      setAutoApprove(data.auto_approve);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAutoApprove();
  }, [fetchUsers, fetchAutoApprove]);

  const handleToggleMode = async () => {
    if (autoApprove === null) return;
    setSavingMode(true);
    try {
      const data = await apiFetch<{ auto_approve: boolean }>("/api/v1/admin/settings/auto-approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_approve: !autoApprove }),
      });
      setAutoApprove(data.auto_approve);
      toast.success(data.auto_approve ? "Modo automático ativado." : "Modo manual ativado — novos usuários precisam de aprovação.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar modo.");
    } finally {
      setSavingMode(false);
    }
  };

  const handleApprove = async (user: AdminUser) => {
    setApprovingId(user.id);
    try {
      await apiFetch(`/api/v1/admin/users/${user.id}/approve`, { method: "POST" });
      toast.success(`${user.name || user.email} aprovado com sucesso.`);
      fetchUsers();
      if (tab === "pendentes" && users.filter(u => !u.is_active).length === 1) {
        setTab("todos");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao aprovar usuário.");
    } finally {
      setApprovingId(null);
    }
  };

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

  const pending = users.filter(u => !u.is_active);

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    if (tab === "pendentes") return !u.is_active;
    if (tab === "ativos") return u.is_active;
    if (tab === "inativos") return !u.is_active;
    return true;
  });

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "todos", label: "Todos", count: users.length },
    { key: "pendentes", label: "Pendentes", count: pending.length },
    { key: "ativos", label: "Ativos", count: users.filter(u => u.is_active).length },
  ];

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
          <p className="text-[12px] text-text-muted">Gestão de contas e aprovações</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary border border-border-subtle hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {/* Modo de aprovação */}
      <div className="flex items-center justify-between bg-surface border border-border-subtle rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          {autoApprove ? (
            <Zap className="w-4 h-4 text-success shrink-0" />
          ) : (
            <ZapOff className="w-4 h-4 text-warning shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold text-text-primary">
              Modo {autoApprove === null ? "..." : autoApprove ? "Automático" : "Manual"}
            </p>
            <p className="text-[11px] text-text-muted">
              {autoApprove
                ? "Novos usuários são liberados automaticamente ao se cadastrar"
                : "Novos usuários ficam pendentes até você aprovar manualmente"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleMode}
          disabled={savingMode || autoApprove === null}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${autoApprove ? "bg-success" : "bg-white/10"}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoApprove ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Alerta pendentes */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 bg-warning/8 border border-warning/25 rounded-xl px-5 py-3">
          <Clock className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-semibold">{pending.length} {pending.length === 1 ? "usuário aguardando" : "usuários aguardando"}</span> aprovação para acessar a plataforma.
          </p>
          <button onClick={() => setTab("pendentes")} className="ml-auto text-[10px] text-warning border border-warning/30 px-2.5 py-1 rounded-lg hover:bg-warning/10 transition-colors">
            Ver pendentes
          </button>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-lg p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors ${
                tab === t.key ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  t.key === "pendentes" ? "bg-warning/20 text-warning" : "bg-white/10 text-text-muted"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

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
        {search && (
          <button onClick={() => setSearch("")} className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-danger px-3 py-2 border border-border-subtle rounded-lg transition-colors">
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
                    {[...Array(3)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 w-24 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                    <td className="px-5 py-3"><div className="h-3 w-16 bg-white/5 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-text-muted text-sm">
                      {tab === "pendentes" ? "Nenhum usuário pendente. ✓" : "Nenhum usuário encontrado."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const initials = (user.name || user.email || "?")
                    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                  const createdDate = new Date(user.created_at).toLocaleDateString("pt-BR");
                  const isPending = !user.is_active;

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-border-subtle/50 transition-colors ${isPending ? "bg-warning/3 hover:bg-warning/5" : "hover:bg-white/2"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPending ? "bg-warning/15 border border-warning/25" : "bg-primary/15 border border-primary/25"}`}>
                            <span className={`text-[10px] font-bold ${isPending ? "text-warning" : "text-primary"}`}>{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate max-w-[130px]">{user.name || "—"}</p>
                            {user.role === "admin" && <span className="text-[9px] text-secondary">admin</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-secondary truncate max-w-[200px] block">{user.email || "—"}</span>
                      </td>

                      <td className="px-4 py-3">
                        {isPending ? (
                          <span className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded w-fit">
                            <Clock className="w-2.5 h-2.5" />
                            Pendente
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded w-fit">
                            <div className="w-1 h-1 rounded-full bg-success" />
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-[11px] text-text-muted">{createdDate}</span>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={approvingId === user.id}
                              className="flex items-center gap-1 text-[10px] text-success border border-success/30 hover:bg-success/10 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 font-medium"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {approvingId === user.id ? "Aprovando..." : "Aprovar"}
                            </button>
                          )}
                          <button
                            onClick={() => setEditUser(user)}
                            className="flex items-center gap-1 text-[10px] text-text-muted border border-border-subtle hover:border-secondary/40 hover:text-secondary px-2 py-1 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          {!isPending && (
                            <button
                              onClick={() => handleToggle(user)}
                              disabled={togglingId === user.id}
                              className="relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 bg-success"
                            >
                              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform translate-x-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-muted">{filtered.length} de {users.length} usuários</p>
          </div>
        )}
      </div>

      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />
      )}
    </div>
  );
}
