export interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  is_active: boolean
  role: "admin" | "user"
  avatar_url: string | null
  created_at: string
}

export interface AdminStats {
  total_users: number
  active_users: number
  new_users_week: number
  total_bots: number
  total_leads: number
  new_leads_week: number
  total_flows: number
  total_revenue: number
}

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  username: string | null
  is_active: boolean
  role: "admin" | "user"
  avatar_url: string | null
  created_at: string
}

export interface AdminQueue {
  name: string
  size: number
  processing: number
  failed: number
  scheduled: number
}

export interface AdminQueueTask {
  id: string
  task_type: string
  lead_id: string
  error: string
  failed_at: string
}

export interface AdminBroadcastGlobal {
  id: string
  name: string
  user_email: string
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ERROR"
  total_leads: number
  successful_count: number
  failed_count: number
  started_at: string | null
}

export interface AdminDuplicate {
  lead_id: string
  lead_name: string
  bot_name: string
  content: string
  count: number
  first_at: string
  last_at: string
  origin: "flow" | "broadcast" | "ai" | "manual"
}
