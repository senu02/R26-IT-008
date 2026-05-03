// app/services/ToxicityDetection/actions.ts
// Matches backend: toxicity_detection/views.py, models.py, serializers.py

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ─────────────────────────────────────────────
// Core API caller
// ─────────────────────────────────────────────

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Token ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (options.headers) Object.assign(headers, options.headers as Record<string, string>);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
    }
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorData.error || errorData.message || errorData.detail || `API error ${response.status}`
    );
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ─────────────────────────────────────────────
// Types — mirrored from serializers.py
// ─────────────────────────────────────────────

// ToxicityLogSerializer fields:
// id, content_type, post, comment, author, author_email, analysed_text,
// is_toxic, max_score, label_scores, flagged_labels,
// is_reviewed, reviewer, reviewer_email, review_notes, overridden, created_at

export interface ToxicityLog {
  id: string;
  content_type: 'post' | 'comment';
  post: string | null;
  comment: string | null;
  author: string;
  author_email: string;
  analysed_text: string;
  is_toxic: boolean;
  max_score: number;
  label_scores: Record<string, number>;
  flagged_labels: string[];
  is_reviewed: boolean;
  reviewer: string | null;
  reviewer_email: string | null;
  review_notes: string | null;
  overridden: boolean;
  created_at: string;
}

// UserToxicityProfileSerializer fields:
// id, user, user_email, total_posts_checked, toxic_post_count,
// total_comments_checked, toxic_comment_count, total_toxic_count, toxicity_rate,
// highest_toxicity_score, is_flagged, is_suspended, last_toxic_at, updated_at

export interface UserToxicityProfile {
  id: string;
  user: string;
  user_email: string;
  total_posts_checked: number;
  toxic_post_count: number;
  total_comments_checked: number;
  toxic_comment_count: number;
  total_toxic_count: number;       // computed property on model
  toxicity_rate: number;           // computed property on model
  highest_toxicity_score: number;
  is_flagged: boolean;
  is_suspended: boolean;
  last_toxic_at: string | null;
  updated_at: string;
}

export interface ToxicityCheckResponse {
  is_toxic: boolean;
  max_score: number;
  label_scores: Record<string, number>;
  flagged_labels: string[];
}

export interface ReviewLogRequest {
  overridden: boolean;
  review_notes: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─────────────────────────────────────────────
// Query param interfaces
// ─────────────────────────────────────────────

export interface ToxicityLogsParams {
  is_toxic?: boolean;
  content_type?: 'post' | 'comment';
  user_id?: string;
  reviewed?: boolean;
  page?: number;
  page_size?: number;
}

export interface UserProfilesParams {
  flagged?: boolean;
  page?: number;
  page_size?: number;
}

// ─────────────────────────────────────────────
// API methods — exact backend routes from urls.py + views.py
//
// Router registers 'toxicity' viewset → basename 'toxicity'
// But the @action url_paths define exact sub-paths:
//
//   POST /api/toxicity/check/
//   GET  /api/toxicity/logs/
//   GET  /api/toxicity/logs/{log_id}/         (detail=True with url_path override)
//   POST /api/toxicity/logs/{log_id}/review/
//   GET  /api/toxicity/user-profiles/
//   POST /api/toxicity/user-profiles/{user_id}/flag/
// ─────────────────────────────────────────────

async function normalisePaginated<T>(response: any): Promise<PaginatedResponse<T>> {
  if (response?.results && Array.isArray(response.results)) {
    return response as PaginatedResponse<T>;
  }
  if (Array.isArray(response)) {
    return { count: response.length, next: null, previous: null, results: response };
  }
  return { count: 0, next: null, previous: null, results: [] };
}

export const toxicityAPI = {
  // POST /api/toxicity/check/
  async checkText(text: string): Promise<ToxicityCheckResponse> {
    return apiCall<ToxicityCheckResponse>('/toxicity/check/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // GET /api/toxicity/logs/
  async getLogs(params: ToxicityLogsParams = {}): Promise<PaginatedResponse<ToxicityLog>> {
    const q = new URLSearchParams();
    if (params.is_toxic !== undefined) q.append('is_toxic', String(params.is_toxic));
    if (params.content_type) q.append('content_type', params.content_type);
    if (params.user_id) q.append('user_id', params.user_id);
    if (params.reviewed !== undefined) q.append('reviewed', String(params.reviewed));
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));

    const url = `/toxicity/logs/${q.toString() ? `?${q}` : ''}`;
    const raw = await apiCall<any>(url, { method: 'GET' });
    return normalisePaginated<ToxicityLog>(raw);
  },

  // GET /api/toxicity/logs/{log_id}/
  async getLogDetail(logId: string): Promise<ToxicityLog> {
    return apiCall<ToxicityLog>(`/toxicity/logs/${logId}/`, { method: 'GET' });
  },

  // POST /api/toxicity/logs/{log_id}/review/
  async reviewLog(
    logId: string,
    data: ReviewLogRequest
  ): Promise<{ message: string; log: ToxicityLog }> {
    return apiCall<{ message: string; log: ToxicityLog }>(
      `/toxicity/logs/${logId}/review/`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  // GET /api/toxicity/user-profiles/
  async getUserProfiles(
    params: UserProfilesParams = {}
  ): Promise<PaginatedResponse<UserToxicityProfile>> {
    const q = new URLSearchParams();
    if (params.flagged !== undefined) q.append('flagged', String(params.flagged));
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));

    const url = `/toxicity/user-profiles/${q.toString() ? `?${q}` : ''}`;
    const raw = await apiCall<any>(url, { method: 'GET' });
    return normalisePaginated<UserToxicityProfile>(raw);
  },

  // POST /api/toxicity/user-profiles/{user_id}/flag/  (toggles is_flagged)
  async toggleUserFlag(userId: string): Promise<{ user_id: string; is_flagged: boolean }> {
    return apiCall<{ user_id: string; is_flagged: boolean }>(
      `/toxicity/user-profiles/${userId}/flag/`,
      { method: 'POST' }
    );
  },
};

// ─────────────────────────────────────────────
// Data transform helpers
// ─────────────────────────────────────────────

export function getSeverity(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 0.8) return 'Critical';
  if (score >= 0.6) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

export function getLogStatus(log: ToxicityLog): 'Resolved' | 'Reviewing' | 'Pending' {
  if (log.is_reviewed) return 'Resolved';
  if (log.overridden) return 'Reviewing';
  return 'Pending';
}

export function transformLogsToStats(logs: ToxicityLog[]) {
  return {
    totalDetections: logs.length,
    resolvedCases: logs.filter((l) => l.is_reviewed).length,
    // Active flags = toxic but not yet reviewed and not overridden
    activeFlags: logs.filter((l) => l.is_toxic && !l.is_reviewed && !l.overridden).length,
  };
}

export function transformLogsToTrendData(logs: ToxicityLog[]) {
  // Group by month-name in insertion order
  const monthly: Record<string, { toxic: number; nonToxic: number }> = {};

  [...logs]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((log) => {
      const key = new Date(log.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { toxic: 0, nonToxic: 0 };
      if (log.is_toxic) monthly[key].toxic++;
      else monthly[key].nonToxic++;
    });

  const labels = Object.keys(monthly);
  return {
    labels,
    toxicData: labels.map((l) => monthly[l].toxic),
    nonToxicData: labels.map((l) => monthly[l].nonToxic),
  };
}

// Maps backend flagged_labels to display categories
const LABEL_MAP: Record<string, string> = {
  hate_speech: 'Hate speech',
  hate: 'Hate speech',
  harassment: 'Harassment',
  profanity: 'Profanity',
  swear: 'Profanity',
  threat: 'Threats',
  threats: 'Threats',
  spam: 'Spam',
};

export function getCategoryLabel(labels: string[]): string {
  if (!labels?.length) return 'Unknown';
  return LABEL_MAP[labels[0].toLowerCase()] ?? labels[0];
}

export function transformLogsToCategoryData(logs: ToxicityLog[]) {
  const counts: Record<string, number> = {
    'Hate speech': 0,
    Harassment: 0,
    Profanity: 0,
    Threats: 0,
    Spam: 0,
  };

  logs.forEach((log) => {
    log.flagged_labels.forEach((label) => {
      const display = LABEL_MAP[label.toLowerCase()];
      if (display && display in counts) counts[display]++;
      else counts['Harassment']++;           // fallback bucket
    });
  });

  return {
    labels: Object.keys(counts),
    data: Object.values(counts),
  };
}

export function transformLogsToDailyData(logs: ToxicityLog[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const detected: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
  const resolved: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));

  logs.forEach((log) => {
    const day = new Date(log.created_at).toLocaleString('default', { weekday: 'short' });
    if (log.is_toxic) detected[day] = (detected[day] ?? 0) + 1;
    if (log.is_reviewed) resolved[day] = (resolved[day] ?? 0) + 1;
  });

  return {
    labels: days,
    detectedData: days.map((d) => detected[d] ?? 0),
    resolvedData: days.map((d) => resolved[d] ?? 0),
  };
}

export function transformProfilesToQuickMetrics(profiles: UserToxicityProfile[]) {
  return {
    flaggedUsers: profiles.filter((p) => p.is_flagged).length,
    suspendedUsers: profiles.filter((p) => p.is_suspended).length,
    highRiskUsers: profiles.filter((p) => p.toxicity_rate > 0.5).length,
  };
}

export default toxicityAPI;