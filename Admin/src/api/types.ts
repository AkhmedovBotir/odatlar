export interface ApiErrorBody {
  error: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export type AdminStatus = 'active' | 'inactive'

export interface Admin {
  id: number
  first_name: string
  last_name: string
  username: string
  phone: string
  status: AdminStatus
  created_at: string
  updated_at: string
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminAuthResponse {
  token: string
  admin: Admin
}

export interface AdminProfileResponse {
  admin: Admin
}

export interface CreateAdminRequest {
  first_name: string
  last_name: string
  username: string
  phone: string
  password: string
}

export interface UpdateAdminRequest {
  first_name?: string
  last_name?: string
  username?: string
  phone?: string
  password?: string
}

export interface UpdateAdminStatusRequest {
  status: AdminStatus
}

export interface AdminListResponse {
  data: Admin[]
  total: number
  page: number
  limit: number
}

export interface HealthResponse {
  status: string
}

export interface BotTokenInfo {
  has_token: boolean
  masked_token: string
  bot_username: string
  is_active: boolean
}

export interface BotStartButton {
  enabled: boolean
  text: string
  web_app_url: string
}

export interface BotStartSettings {
  message: string
  button: BotStartButton
}

export interface BotSettings {
  token: BotTokenInfo
  start: BotStartSettings
  updated_at: string
}

export interface UpdateBotTokenRequest {
  bot_token: string
}

export interface UpdateBotSettingsRequest {
  start?: BotStartSettings
}

export interface BotUser {
  id: number
  telegram_id: number
  first_name: string
  last_name: string
  username: string
  phone: string
  language_code: string
  avatar_url: string
  is_bot: boolean
  is_premium: boolean
  xp: number
  level: number
  started_at: string
  last_start_at: string
}

export interface XPSettings {
  practice_complete_xp: number
  indicator_log_xp: number
  dominant_create_xp: number
  dominant_session_xp: number
  level_up_xp: number
  updated_at: string
}

export interface UpdateXPSettingsRequest {
  practice_complete_xp: number
  indicator_log_xp: number
  dominant_create_xp: number
  dominant_session_xp: number
  level_up_xp: number
}

export interface AdminUserStats {
  total: number
  new_today: number
  new_this_week: number
  active_this_week: number
  with_phone: number
  premium: number
}

export interface AdminActivityStats {
  total_items: number
  total_entries: number
  entries_today: number
}

export interface AdminXPStats {
  total_xp: number
  avg_xp: number
  max_xp: number
  max_level: number
  avg_level: number
  level_up_xp: number
}

export interface AdminStats {
  users: AdminUserStats
  practices: AdminActivityStats
  indicators: AdminActivityStats
  dominants: AdminActivityStats
  xp: AdminXPStats
  generated_at: string
}

export interface AdminLeaderboardEntry {
  rank: number
  bot_user_id: number
  telegram_id: number
  name: string
  username?: string
  xp: number
  level: number
}

export interface AdminLeaderboardResponse {
  data: AdminLeaderboardEntry[]
  total: number
  limit: number
}

export interface BotUserListResponse {
  data: BotUser[]
  total: number
  page: number
  limit: number
}

export interface BotUserDetailsResponse extends BotUser {}

export interface GuideVideo {
  id: string
  title: string
  description: string
  src: string
  poster?: string
  durationMin?: number
  sortOrder?: number
  isPublished?: boolean
  likesCount?: number
  commentsCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface GuideVideoListResponse {
  data: GuideVideo[]
}

export interface GuideUploadResponse {
  path: string
  url: string
}

export interface CreateGuideVideoRequest {
  title: string
  description?: string
  src: string
  poster?: string
  duration_min?: number
  sort_order?: number
  is_published?: boolean
}

export interface UpdateGuideVideoRequest {
  title: string
  description?: string
  src: string
  poster?: string
  duration_min?: number
  sort_order?: number
  is_published: boolean
}

export interface GuideFile {
  id: string
  title: string
  description: string
  url: string
  ext: string
  sizeLabel?: string
  sizeBytes?: number
  sortOrder?: number
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface GuideFileListResponse {
  data: GuideFile[]
}

export interface GuideFileUploadResponse {
  path: string
  url: string
  ext: string
  sizeLabel: string
  sizeBytes: number
}

export interface CreateGuideFileRequest {
  slug: string
  title: string
  description?: string
  url: string
  ext: string
  size_bytes?: number
  sort_order?: number
  is_published?: boolean
}

export interface UpdateGuideFileRequest {
  slug: string
  title: string
  description?: string
  url: string
  ext: string
  size_bytes?: number
  sort_order?: number
  is_published: boolean
}
