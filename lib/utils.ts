import { APIBot, Bot, APILead, Lead, APIMessage, Message } from "@/types"

// ─── MARKUS Utility Functions ────────────────────────────────────────────────

/**
 * Formats a number as Brazilian BRL currency.
 * @example formatRevenue(1234.56) → "R$ 1.234,56"
 */
export function formatRevenue(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Formats a number with Brazilian thousands separator.
 * @example formatNumber(1234) → "1.234"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR")
}

/**
 * Formats an ISO date string to Brazilian short date.
 * @example formatDate("2026-05-09T17:37:00Z") → "09 mai. 2026, 14:37"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

/**
 * Merges class names, filtering falsy values (clsx-style).
 * @example cn("foo", false && "bar", "baz") → "foo baz"
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Maps a backend APIBot to a frontend Bot interface.
 */
export function mapAPIBot(b: APIBot): Bot {
  const handle = b.username
    ? "@" + b.username
    : "@" + b.name.toLowerCase().replace(/\s+/g, '_') + "_bot"

  const COLORS = ["#00c8ff", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"]
  const color = COLORS[Math.abs(b.id.charCodeAt(0) + b.id.charCodeAt(1)) % COLORS.length]

  return {
    id: b.id,
    name: b.name,
    handle,
    status: b.status === "active" ? "online" : "offline",
    initials: b.name.slice(0, 2).toUpperCase(),
    color,
    aiEnabled: b.ai_enabled,
    leads: b.total_leads ?? 0,
    revenue: b.total_revenue ?? 0,
    activeFlows: 0,
    pixPriorityRoute: b.pix_priority_route ?? [],
    utmify_account_id: b.utmify_account_id,
    tiktok_account_id: b.tiktok_account_id,
    meta_pixel_account_ids: b.meta_pixel_account_ids,
    media_channel_id: b.media_channel_id,
  }
}

/**
 * Maps a backend APILead to a frontend Lead interface.
 */
export function mapAPILead(l: APILead): Lead {
  return {
    id: l.id,
    name: l.name || "Sem Nome",
    telegramId: l.external_id || "",
    avatar: l.avatar || "/images/avatars/default.jpg",
    lastMsg: l.last_msg || "...",
    lastActive: l.last_message_at ? formatDate(l.last_message_at) : "Nunca",
    bot: l.bot?.name || l.bot_id,
    tags: l.tags || [],
    status: l.status === "LEAD" ? "ativo" : l.status === "CUSTOMER" ? "convertido" : "inativo",
    revenue: l.revenue,
    flows: 0,
    hasAI: l.has_ai_interacted,
  }
}

/**
 * Maps a backend APIMessage to a frontend Message interface.
 */
const API_BASE = "https://api.markus.business"

function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  if (url.startsWith("/")) return `${API_BASE}${url}`
  // Telegram file_ids and file_paths (migrated from old system) — not serveable
  return null
}

export function mapAPIMessage(m: APIMessage): Message {
  return {
    id: m.id,
    type: m.direction === "INBOUND" ? "inbound" : "outbound",
    text: m.content || undefined,
    mediaUrl: resolveMediaUrl(m.media_url),
    time: new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
    isAI: m.is_ai,
    kind: m.type?.toLowerCase() || "text",
  }
}
