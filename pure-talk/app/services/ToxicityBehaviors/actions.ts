// app/services/ToxicityBehavior/actions.ts
// Matches backend: toxicity_behavior/models.py, serializers.py, views.py
// Updated with Psychological Metrics

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    const err: any = new Error(errorData.error || errorData.detail || `API error ${response.status}`);
    err.status = response.status;
    throw err;
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

async function normalisePaginated<T>(response: any): Promise<PaginatedResponse<T>> {
  if (response?.results && Array.isArray(response.results)) return response as PaginatedResponse<T>;
  if (Array.isArray(response)) return { count: response.length, next: null, previous: null, results: response };
  return { count: 0, next: null, previous: null, results: [] };
}

// ─────────────────────────────────────────────
// Types (Updated with Psychological Metrics)
// ─────────────────────────────────────────────

export type WarningLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'banned';
export type EventType    = 'allowed' | 'warned' | 'blocked' | 'suspended';
export type ContentType  = 'post' | 'comment';
export type NodeType     = 'normal' | 'at_risk' | 'toxic';
export type EdgeType     = 'normal' | 'mixed' | 'toxic_reply';
export type PsychologicalPattern = 'one_off' | 'chronic_low' | 'escalating' | 'malicious' | 'recovering' | 'impulsive';

// Psychological Profile Interface
export interface PsychologicalProfile {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  pattern: string;
  pattern_description: string;
  impulsivity_score: number;
  malice_score: number;
  escalation_risk: number;
  recovery_score: number;
  weighted_toxicity: number;
  recommendation: {
    action: string;
    days: number;
    reason: string;
    priority: string;
  };
  summary: string;
}

// UserBehaviorProfileSerializer (Updated)
export interface UserBehaviorProfile {
  id: string;
  user: string;
  user_email: string;
  toxic_count: number;
  warning_count: number;
  blocked_count: number;
  severity_score: number;
  warning_level: WarningLevel;
  is_suspended: boolean;
  is_currently_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  effective_threshold: number;
  first_offence_at: string | null;
  last_offence_at: string | null;
  updated_at: string;
  // NEW Psychological fields
  psychological_risk_score: number;
  psychological_pattern: PsychologicalPattern;
  impulsivity_score: number;
  malice_score: number;
  escalation_risk: number;
  recovery_score: number;
  weighted_toxicity_score: number;
  psychological_summary: PsychologicalProfile;
  psychological_recommendation: {
    action: string;
    days: number;
    reason: string;
    priority: string;
  };
}

// BehaviorEventSerializer (Updated)
export interface BehaviorEvent {
  id: string;
  user: string;
  user_email: string;
  content_type: ContentType;
  post: string | null;
  comment: string | null;
  analysed_text: string;
  toxicity_score: number;
  severity: number;
  threshold_used: number;
  category_scores: Record<string, number>;
  flagged_labels: string[];
  event_type: EventType;
  toxic_count_at_event: number;
  warning_level_at_event: string;
  // NEW Psychological metrics at event time
  psych_risk_at_event: number;
  psych_pattern_at_event: string;
  created_at: string;
}

// MyBehaviorStatus (Updated)
export interface MyBehaviorStatus {
  toxic_count: number;
  warning_level: WarningLevel;
  is_suspended: boolean;
  is_currently_suspended: boolean;
  suspended_until: string | null;
  effective_threshold: number;
  severity_score: number;
  psychological_risk_score: number;
  psychological_pattern: string;
  psychological_summary: {
    risk_level: string;
    pattern: string;
    description: string;
    message: string;
  };
}

// Detailed Psychological Analysis Response
export interface PsychologicalAnalysisResponse {
  user: {
    id: number;
    username: string;
    email: string;
    account_status: string;
  };
  psychological_profile: {
    risk_score: number;
    risk_level: string;
    pattern: string;
    pattern_description: string;
    impulsivity_score: number;
    malice_score: number;
    escalation_risk: number;
    recovery_score: number;
    weighted_toxicity: number;
    severity_weighted_offenses: number;
  };
  behavioral_summary: string;
  recommended_action: {
    action: string;
    days: number;
    reason: string;
    priority: string;
  };
  counters: {
    toxic_count: number;
    warning_count: number;
    blocked_count: number;
    severity_score: number;
    warning_level: string;
  };
  suspension_status: {
    is_suspended: boolean;
    suspended_until: string | null;
    suspension_reason: string | null;
  };
  recent_timeline: Array<{
    date: string;
    severity: number;
    toxicity_score: number;
    event_type: string;
    psych_risk: number;
  }>;
  research_notes: {
    analysis_based_on: string;
    metrics_used: string[];
    confidence: string;
  };
}

// Psychological Statistics Response
export interface PsychologicalStatsResponse {
  total_users_analyzed: number;
  pattern_distribution: Record<string, number>;
  risk_distribution: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  pattern_statistics: Record<string, {
    count: number;
    avg_risk: number;
    avg_toxic_count: number;
    suspended_count: number;
  }>;
  average_metrics: {
    avg_psychological_risk: number;
    avg_malice_score: number;
    avg_impulsivity: number;
    avg_escalation_risk: number;
  };
}

// SNA Node (Updated)
export interface SNANode {
  user_id: number;
  username: string;
  node_type: NodeType;
  toxic_count: number;
  severity_score: number;
  warning_level: WarningLevel;
  is_suspended: boolean;
  degree_centrality: number;
  in_degree_centrality: number;
  out_degree_centrality: number;
  betweenness_centrality: number;
  clustering_coefficient: number;
  total_interactions: number;
  toxic_interactions: number;
  toxic_ratio: number;
  psychological_risk_score: number;
  psychological_pattern: string;
  malice_score: number;
  impulsivity_score: number;
  escalation_risk: number;
}

export interface SNAEdge {
  source: number;
  target: number;
  weight: number;
  toxic_count: number;
  is_toxic_edge: boolean;
  max_toxicity_score: number;
  flagged_labels: string[];
  edge_type: EdgeType;
}

export interface SNASummary {
  total_nodes: number;
  total_edges: number;
  toxic_nodes: number;
  at_risk_nodes: number;
  normal_nodes: number;
  toxic_edges: number;
  normal_edges: number;
  top_degree: any[];
  top_betweenness: any[];
  top_toxic_ratio: any[];
  avg_clustering: number;
  toxic_clusters: any[];
  contagion_candidates: any[];
}

export interface SNAGraph { nodes: SNANode[]; edges: SNAEdge[]; summary: SNASummary; }
export interface PaginatedResponse<T> { count: number; next: string | null; previous: string | null; results: T[]; }
export interface ProfilesParams { warning_level?: WarningLevel; is_suspended?: boolean; psychological_pattern?: PsychologicalPattern; page?: number; page_size?: number; }
export interface EventsParams { user_id?: string; event_type?: EventType; content_type?: ContentType; psych_pattern?: string; page?: number; page_size?: number; }
export interface SuspendRequest { hours?: number; reason?: string; }

// ─────────────────────────────────────────────
// Psychological Pattern Helpers
// ─────────────────────────────────────────────

export const PSYCHOLOGICAL_PATTERNS: PsychologicalPattern[] = [
  'one_off', 'chronic_low', 'escalating', 'malicious', 'recovering', 'impulsive'
];

export function getPsychologicalPatternLabel(pattern: PsychologicalPattern): string {
  const labels: Record<PsychologicalPattern, string> = {
    one_off: 'Single Offence',
    chronic_low: 'Chronic Low',
    escalating: 'ESCALATING',
    malicious: 'MALICIOUS',
    recovering: 'Recovering',
    impulsive: 'Impulsive'
  };
  return labels[pattern] ?? pattern;
}

export function getPsychologicalPatternColor(pattern: PsychologicalPattern): string {
  const colors: Record<PsychologicalPattern, string> = {
    one_off: '#22c55e',
    chronic_low: '#eab308',
    escalating: '#ef4444',
    malicious: '#dc2626',
    recovering: '#22c55e',
    impulsive: '#f97316'
  };
  return colors[pattern] ?? '#6b7280';
}

export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#f97316';
    case 'LOW': return '#22c55e';
    default: return '#6b7280';
  }
}

// ─────────────────────────────────────────────
// API methods (Updated)
// ─────────────────────────────────────────────

export const behaviorAPI = {
  // GET /api/behavior/my-status/
  async getMyStatus(): Promise<MyBehaviorStatus> {
    return apiCall<MyBehaviorStatus>('/behavior/my-status/', { method: 'GET' });
  },

  // GET /api/behavior/my-psychological-profile/
  async getMyPsychologicalProfile(): Promise<any> {
    return apiCall('/behavior/my-psychological-profile/', { method: 'GET' });
  },

  // GET /api/behavior/profiles/
  async getProfiles(params: ProfilesParams = {}): Promise<PaginatedResponse<UserBehaviorProfile>> {
    const q = new URLSearchParams();
    if (params.warning_level) q.append('warning_level', params.warning_level);
    if (params.is_suspended !== undefined) q.append('is_suspended', String(params.is_suspended));
    if (params.psychological_pattern) q.append('psychological_pattern', params.psychological_pattern);
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));
    const raw = await apiCall<any>(`/behavior/profiles/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
    return normalisePaginated<UserBehaviorProfile>(raw);
  },

  // GET /api/behavior/profiles/{id}/
  async getProfile(profileId: string): Promise<UserBehaviorProfile> {
    return apiCall<UserBehaviorProfile>(`/behavior/profiles/${profileId}/`, { method: 'GET' });
  },

  // GET /api/behavior/users/{user_id}/psychological-analysis/
  async getUserPsychologicalAnalysis(userId: string): Promise<PsychologicalAnalysisResponse> {
    return apiCall<PsychologicalAnalysisResponse>(`/behavior/users/${userId}/psychological-analysis/`, { method: 'GET' });
  },

  // GET /api/behavior/psychological-stats/
  async getPsychologicalStats(): Promise<PsychologicalStatsResponse> {
    return apiCall<PsychologicalStatsResponse>('/behavior/psychological-stats/', { method: 'GET' });
  },

  // POST /api/behavior/profiles/{id}/suspend/
  async suspendUser(profileId: string, data: SuspendRequest = {}): Promise<{ message: string; suspended_until: string }> {
    return apiCall(`/behavior/profiles/${profileId}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ hours: data.hours ?? 24, reason: data.reason ?? 'Manual suspension by admin.' }),
    });
  },

  // POST /api/behavior/profiles/{id}/lift-suspend/
  async liftSuspension(profileId: string): Promise<{ message: string }> {
    return apiCall(`/behavior/profiles/${profileId}/lift-suspend/`, { method: 'POST' });
  },

  // POST /api/behavior/profiles/{id}/reset/
  async resetProfile(profileId: string): Promise<{ message: string }> {
    return apiCall(`/behavior/profiles/${profileId}/reset/`, { method: 'POST' });
  },

  // GET /api/behavior/events/
  async getEvents(params: EventsParams = {}): Promise<PaginatedResponse<BehaviorEvent>> {
    const q = new URLSearchParams();
    if (params.user_id) q.append('user_id', params.user_id);
    if (params.event_type) q.append('event_type', params.event_type);
    if (params.content_type) q.append('content_type', params.content_type);
    if (params.psych_pattern) q.append('psych_pattern', params.psych_pattern);
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));
    const raw = await apiCall<any>(`/behavior/events/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
    return normalisePaginated<BehaviorEvent>(raw);
  },

  // GET /api/behavior/analytics/summary/
  async getAnalyticsSummary(): Promise<any> {
    return apiCall('/behavior/analytics/summary/', { method: 'GET' });
  },

  // GET /api/behavior/user/{user_id}/timeline/
  async getUserTimeline(userId: string): Promise<any> {
    return apiCall(`/behavior/user/${userId}/timeline/`, { method: 'GET' });
  },

  // GET /api/behavior/sna/graph/
  async getSNAGraph(): Promise<SNAGraph> {
    return apiCall<SNAGraph>('/behavior/sna/graph/', { method: 'GET' });
  },

  // GET /api/behavior/sna/summary/
  async getSNASummary(): Promise<SNASummary> {
    return apiCall<SNASummary>('/behavior/sna/summary/', { method: 'GET' });
  },

  // GET /api/behavior/sna/nodes/
  async getSNANodes(params?: { node_type?: NodeType; psychological_pattern?: string; risk_min?: number; sort?: string }): Promise<SNANode[]> {
    const q = new URLSearchParams();
    if (params?.node_type) q.append('node_type', params.node_type);
    if (params?.psychological_pattern) q.append('psychological_pattern', params.psychological_pattern);
    if (params?.risk_min) q.append('risk_min', String(params.risk_min));
    if (params?.sort) q.append('sort', params.sort);
    return apiCall<SNANode[]>(`/behavior/sna/nodes/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
  },

  // GET /api/behavior/sna/edges/
  async getSNAEdges(params?: { edge_type?: EdgeType }): Promise<SNAEdge[]> {
    const q = new URLSearchParams();
    if (params?.edge_type) q.append('edge_type', params.edge_type);
    return apiCall<SNAEdge[]>(`/behavior/sna/edges/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
  },

  // GET /api/behavior/sna/user/{user_id}/
  async getSNAUserNode(userId: string): Promise<{ node: SNANode; edges: SNAEdge[] }> {
    return apiCall(`/behavior/sna/user/${userId}/`, { method: 'GET' });
  },

  // GET /api/behavior/sna/clusters/
  async getSNAClusters(): Promise<any> {
    return apiCall('/behavior/sna/clusters/', { method: 'GET' });
  },
};

// ─────────────────────────────────────────────
// Transform helpers (Updated)
// ─────────────────────────────────────────────

export const WARNING_LEVEL_ORDER: WarningLevel[] = ['none', 'mild', 'moderate', 'severe', 'banned'];

export function getWarningLevelLabel(level: WarningLevel): string {
  return { none: 'Clean', mild: 'Mild', moderate: 'Moderate', severe: 'Severe', banned: 'Banned' }[level] ?? level;
}

export function getWarningLevelColor(level: WarningLevel): string {
  return { none: '#22c55e', mild: '#eab308', moderate: '#f97316', severe: '#ef4444', banned: '#7c3aed' }[level] ?? '#6b7280';
}

export function getEventTypeColor(type: EventType): string {
  return { allowed: '#22c55e', warned: '#eab308', blocked: '#ef4444', suspended: '#7c3aed' }[type] ?? '#6b7280';
}

export function getNodeTypeColor(type: NodeType): string {
  return { toxic: '#ef4444', at_risk: '#f97316', normal: '#22c55e' }[type] ?? '#6b7280';
}

// Mirrors backend OFFENSE_MULTIPLIER exactly from models.py
export function computeEffectiveThreshold(toxicCount: number, severityScore: number): number {
  const BASE = 0.5;
  const multiplierMap: Record<number, number> = { 0: 1.0, 1: 1.3, 2: 1.8, 3: 2.5 };
  const multiplier = toxicCount >= 4 ? 4.0 : (multiplierMap[toxicCount] ?? 1.0);
  let threshold = BASE / multiplier;
  if (severityScore > 0.8) threshold *= 0.7;
  return Math.max(parseFloat(threshold.toFixed(4)), 0.1);
}

export function transformEventsToDailyData(events: BehaviorEvent[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay: Record<string, Record<EventType, number>> = {};
  days.forEach((d) => { byDay[d] = { allowed: 0, warned: 0, blocked: 0, suspended: 0 }; });
  events.forEach((e) => {
    const day = new Date(e.created_at).toLocaleString('default', { weekday: 'short' });
    if (byDay[day]) byDay[day][e.event_type] = (byDay[day][e.event_type] ?? 0) + 1;
  });
  return {
    labels:    days,
    allowed:   days.map((d) => byDay[d].allowed),
    warned:    days.map((d) => byDay[d].warned),
    blocked:   days.map((d) => byDay[d].blocked),
    suspended: days.map((d) => byDay[d].suspended),
  };
}

export function transformProfilesToLevelData(profiles: UserBehaviorProfile[]) {
  const counts: Record<WarningLevel, number> = { none: 0, mild: 0, moderate: 0, severe: 0, banned: 0 };
  profiles.forEach((p) => { counts[p.warning_level] = (counts[p.warning_level] ?? 0) + 1; });
  return {
    labels: WARNING_LEVEL_ORDER.map(getWarningLevelLabel),
    data:   WARNING_LEVEL_ORDER.map((l) => counts[l]),
    colors: WARNING_LEVEL_ORDER.map(getWarningLevelColor),
  };
}

// NEW: Transform psychological pattern distribution
export function transformProfilesToPsychologicalData(profiles: UserBehaviorProfile[]) {
  const patternLabels = PSYCHOLOGICAL_PATTERNS.map(getPsychologicalPatternLabel);
  const counts = PSYCHOLOGICAL_PATTERNS.map((p) => 
    profiles.filter((profile) => profile.psychological_pattern === p).length
  );
  const colors = PSYCHOLOGICAL_PATTERNS.map(getPsychologicalPatternColor);
  return { labels: patternLabels, data: counts, colors };
}

export function transformEventsToTypeBreakdown(events: BehaviorEvent[]) {
  const types: EventType[] = ['allowed', 'warned', 'blocked', 'suspended'];
  const counts: Record<EventType, number> = { allowed: 0, warned: 0, blocked: 0, suspended: 0 };
  events.forEach((e) => { counts[e.event_type] = (counts[e.event_type] ?? 0) + 1; });
  return {
    labels: types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
    data:   types.map((t) => counts[t]),
    colors: types.map(getEventTypeColor),
  };
}

// Category weights from services.py CATEGORY_WEIGHTS
export function transformEventsToCategoryAverages(events: BehaviorEvent[]) {
  const CATEGORIES = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];
  const LABELS     = ['Toxic', 'Severe Toxic', 'Obscene', 'Threat', 'Insult', 'Identity Hate'];
  const sums: Record<string, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  const nonAllowed = events.filter((e) => e.event_type !== 'allowed');
  nonAllowed.forEach((e) => {
    CATEGORIES.forEach((cat) => { sums[cat] += e.category_scores[cat] ?? 0; });
  });
  const n = nonAllowed.length || 1;
  return { labels: LABELS, data: CATEGORIES.map((c) => parseFloat((sums[c] / n).toFixed(3))) };
}

export function transformToOverviewStats(profiles: UserBehaviorProfile[], events: BehaviorEvent[]) {
  return {
    totalViolations:  profiles.reduce((s, p) => s + p.toxic_count, 0),
    totalBlocked:     events.filter((e) => e.event_type === 'blocked').length,
    totalSuspended:   profiles.filter((p) => p.is_currently_suspended).length,
    atRisk:           profiles.filter((p) => p.warning_level === 'moderate' || p.warning_level === 'severe').length,
    totalProfiles:    profiles.length,
    highRiskUsers:    profiles.filter((p) => p.psychological_risk_score > 0.6).length,
    escalatingUsers:  profiles.filter((p) => p.psychological_pattern === 'escalating').length,
    maliciousUsers:   profiles.filter((p) => p.psychological_pattern === 'malicious').length,
    recoveringUsers:  profiles.filter((p) => p.psychological_pattern === 'recovering').length,
  };
}

export default behaviorAPI;