// ================================================================
// app/services/ToxicityBehaviors/actions.ts
// Section 3.6 — Adaptive Emotional Shielding Strategy (Behaviour Layer)
// Section 3.7 — Explainable AI Integration (LIME & SHAP)
// Matches backend: toxicity_behavior/models.py, serializers.py, views.py
// ================================================================
//
// [EN] This module handles the Behavioural Analysis layer of the AESM system.
//      It tracks per-user toxicity histories, computes severity scores, manages
//      warning escalation (none → mild → moderate → severe → banned), and feeds
//      into the adaptive shielding decision engine described in Section 3.6.
//      It also exposes the XAI (Explainable AI) endpoint (Section 3.7) which
//      uses SHAP values to explain WHY a particular intervention was triggered.
//
// [SL] Meka module eka AESM system eke Behavioural Analysis layer eka handle
//      karannawa. User eke toxicity history track karannawa, severity scores
//      calculate karannawa, saha warning eka escalate karannawa
//      (none → mild → moderate → severe → banned). Meya Section 3.6 eke
//      adaptive shielding decision engine ekata data pathkarannawa.
//      Section 3.7 eke XAI endpoint eka (SHAP values use karala) AI eka
//      kiyata intervention trigger wuna hinda explain karannawa.
// ================================================================

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
// Types
// ─────────────────────────────────────────────
//
// [EN] All TypeScript interfaces below mirror the Django REST Framework
//      serializers in toxicity_behavior/serializers.py. Keep these in sync
//      whenever the backend schema changes.
//
// [SL] Mehemat thiyana TypeScript interfaces hama ekama backend eke
//      toxicity_behavior/serializers.py eke serializers walata match wenawa.
//      Backend schema change una wita mekath update karanna ona.

/**
 * [EN] Warning levels that escalate as a user's toxic behaviour increases.
 *      The adaptive shielding system uses this level to calibrate its response.
 * [SL] User ge toxic behaviour eka increase wena wita escalate wena warning levels.
 *      Adaptive shielding system eka meka use karala response eka calibrate karannawa.
 *
 *  none     → [EN] No violations detected yet.       [SL] Ekkath violation nehe.
 *  mild     → [EN] Minor infractions, low risk.      [SL] Kicchi violations, low risk.
 *  moderate → [EN] Recurring violations, monitored.  [SL] Repeat violations, monitor mode.
 *  severe   → [EN] High risk, shielding activated.   [SL] High risk, shielding active.
 *  banned   → [EN] Permanently restricted.           [SL] Permanently ban una.
 */
export type WarningLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'banned';

/**
 * [EN] Event types recorded for each behavioural action.
 * [SL] Hama behavioural action ekakata record karanne meka.
 *  allowed   → [EN] Content passed without intervention. [SL] Content okay, pass kala.
 *  warned    → [EN] User was warned about their content. [SL] User lata warn kala.
 *  blocked   → [EN] Content was blocked/filtered.        [SL] Content block/filter kala.
 *  suspended → [EN] User was temporarily suspended.      [SL] User temporarily suspend kala.
 */
export type EventType    = 'allowed' | 'warned' | 'blocked' | 'suspended';

/** [EN] Content type — post or comment. [SL] Content type eka — post da comment da. */
export type ContentType  = 'post' | 'comment';

/**
 * [EN] Social Network Analysis (SNA) node classification.
 *      Used to visualise toxic influence spread across the network.
 * [SL] Social Network Analysis (SNA) node classification.
 *      Network eke toxic influence spread dakkanna use karannawa.
 */
export type NodeType     = 'normal' | 'at_risk' | 'toxic';

/** [EN] SNA edge type indicating toxicity in a user interaction link. [SL] User interaction link eke toxicity type. */
export type EdgeType     = 'normal' | 'mixed' | 'toxic_reply';

// ─────────────────────────────────────────────────────────────────
// Section 3.6 — Behavioural Profiling Types
// [EN] These profiles are used by the adaptive decision engine to
//      select the correct shielding intervention for each user.
// [SL] Meka profiles eka adaptive decision engine eka use karannawa
//      hama user ekakata correct shielding intervention eka select karanna.
// ─────────────────────────────────────────────────────────────────

// UserBehaviorProfileSerializer
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
}

// BehaviorEventSerializer
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
  created_at: string;
}

export interface MyBehaviorStatus {
  toxic_count: number;
  warning_level: WarningLevel;
  is_suspended: boolean;
  is_currently_suspended: boolean;
  suspended_until: string | null;
  effective_threshold: number;
  severity_score: number;
}

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
export interface ProfilesParams { warning_level?: WarningLevel; is_suspended?: boolean; page?: number; page_size?: number; }
export interface EventsParams { user_id?: string; event_type?: EventType; content_type?: ContentType; page?: number; page_size?: number; }
export interface SuspendRequest { hours?: number; reason?: string; }

// ─────────────────────────────────────────────────────────────────
// Section 3.7 — Explainable AI (XAI) Integration Types
// ─────────────────────────────────────────────────────────────────
//
// [EN] To improve transparency and trust in the automated moderation
//      system, XAI techniques are integrated to explain machine learning
//      predictions. Two methods are supported:
//
//        • SHAP (Shapley Additive Explanations) — currently implemented.
//          Assigns each feature a contribution value to the final risk
//          prediction. For example: a high toxic_count pushes the risk score
//          UP, while a low severity_score pulls it DOWN.
//
//        • LIME (Local Interpretable Model-Agnostic Explanations) — planned.
//          Perturbs input features and observes output changes to build a
//          local linear approximation of the model's decision boundary.
//
//      These explanations are displayed to system administrators and
//      moderators to improve accountability in moderation decisions.
//
// [SL] Automated moderation system eke transparency saha trust improve
//      karanna XAI techniques integrate karala thiyanawa. ML predictions
//      explain karannawa.
//
//        • SHAP — ekkath feature eka final risk prediction ekata
//          keeyadena contribution eka assign karannawa. Udhaaranayak
//          widihata kiyanna nam: high toxic_count eka risk score UP
//          karannawa, low severity_score eka DOWN karannawa.
//
//        • LIME — planned. Input features manipulate karala output
//          changes observe karala model ge decision boundary eka
//          local linear approximation ekakata explain karannawa.
//
//      Meka explanations system admins saha moderators lata dakwannawa,
//      moderation decisions eke accountability improve karanna.
// ─────────────────────────────────────────────────────────────────

/**
 * [EN] Represents a single SHAP explanation for one behavioural feature.
 *      Each feature (e.g. toxic_count, severity_score) gets a SHAP value
 *      that shows how much it contributed to the overall risk score.
 *
 * [SL] Eka behavioural feature ekakata (e.g. toxic_count, severity_score)
 *      SHAP explanation eka represent karannawa. SHAP value eka
 *      overall risk score ekakata feature eka keeyadena tharuwata
 *      contribute kala da kiyala dakwannawa.
 */
export interface ShapFeatureExplanation {
  /** [EN] The SHAP value — magnitude of this feature's contribution. [SL] Feature eke contribution eke size. */
  shap_value: number;

  /**
   * [EN] Direction of impact on the risk score.
   *      'increases_risk' → this feature pushed the score higher.
   *      'decreases_risk' → this feature pulled the score lower.
   * [SL] Risk score ekata impact direction eka.
   *      'increases_risk' → meka score eka wada karanawa.
   *      'decreases_risk' → meka score eka adhu karanawa.
   */
  direction: 'increases_risk' | 'decreases_risk';

  /** [EN] Categorical impact rating for quick dashboard display. [SL] Dashboard walata fast display ekakata impact category. */
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * [EN] Full XAI explanation returned by the backend for a given user profile.
 *      Used by the admin dashboard to show moderators WHY a particular
 *      shielding strategy was triggered for that user.
 *      Currently uses SHAP; LIME support will be added in a future iteration.
 *
 * [SL] Backend eka user profile ekakata full XAI explanation return karannawa.
 *      Admin dashboard eke moderators lata dakkannawa meka user ekakata
 *      shielding strategy eka trigger wuna HINDA kiyala.
 *      Ekkath SHAP use karannawa; LIME future iteration ekakata add wenawa.
 */
export interface XaiExplanation {
  /** [EN] Email of the user being explained. [SL] Explain karanne meka user ge email. */
  user_email: string;

  /** [EN] XAI method used — currently always 'SHAP'. [SL] Use kara XAI method — ekkath 'SHAP'. */
  method: 'SHAP';

  /** [EN] Human-readable risk classification (e.g. 'High Risk'). [SL] Risk level readable label (e.g. 'High Risk'). */
  risk_level: string;

  /** [EN] Numeric risk score from 0.0 (safe) to 1.0 (critical). [SL] 0.0 (safe) ita 1.0 (critical) dadiyata risk score. */
  risk_score: number;

  /** [EN] Behavioural pattern identified (e.g. 'Repeat Offender'). [SL] Identify kala behavioural pattern (e.g. 'Repeat Offender'). */
  behavior_type: string;

  /** [EN] ML model that made the prediction. [SL] Prediction kala ML model eka. */
  model_used: string;

  /** [EN] Whether the ML model is active (vs. rule-based fallback). [SL] ML model active da (rule-based fallback da). */
  ml_active: boolean;

  /**
   * [EN] Map of feature name → SHAP explanation.
   *      null if SHAP could not be computed (e.g. insufficient data).
   * [SL] Feature name → SHAP explanation map eka.
   *      Data nathnam null return wenawa.
   */
  shap_explanation: Record<string, ShapFeatureExplanation> | null;
}

// ─────────────────────────────────────────────────────────────────
// Section 3.6 + 3.7 — API Methods
// BehaviorViewSet → /api/behavior/...
// SNAViewSet      → /api/behavior/sna/...
//
// [EN] The behaviorAPI object exposes all endpoints for behavioural
//      profiling, event tracking, user suspension, Social Network
//      Analysis (SNA), and XAI explanations.
//
// [SL] behaviorAPI object eka behavioural profiling, event tracking,
//      user suspension, Social Network Analysis (SNA), saha XAI
//      explanations walata endpoints hama ekama expose karannawa.
// ─────────────────────────────────────────────────────────────────

export const behaviorAPI = {
  // GET /api/behavior/my-status/
  async getMyStatus(): Promise<MyBehaviorStatus> {
    return apiCall<MyBehaviorStatus>('/behavior/my-status/', { method: 'GET' });
  },

  // GET /api/behavior/profiles/
  async getProfiles(params: ProfilesParams = {}): Promise<PaginatedResponse<UserBehaviorProfile>> {
    const q = new URLSearchParams();
    if (params.warning_level) q.append('warning_level', params.warning_level);
    if (params.is_suspended !== undefined) q.append('is_suspended', String(params.is_suspended));
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));
    const raw = await apiCall<any>(`/behavior/profiles/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
    return normalisePaginated<UserBehaviorProfile>(raw);
  },

  // GET /api/behavior/profiles/{id}/
  async getProfile(profileId: string): Promise<UserBehaviorProfile> {
    return apiCall<UserBehaviorProfile>(`/behavior/profiles/${profileId}/`, { method: 'GET' });
  },

  // ── Section 3.7: XAI Explanation (SHAP) ─────────────────────
  // GET /api/behavior/profiles/{id}/xai-explanation/
  //
  // [EN] Fetches the SHAP-based XAI explanation for a given user's
  //      behavioural risk profile. The explanation shows WHICH features
  //      (e.g. toxic_count, severity_score, warning_level) had the
  //      biggest influence on the predicted risk score, and in which
  //      direction (increases_risk / decreases_risk).
  //      Displayed in the admin dashboard for moderator transparency.
  //
  // [SL] User eke behavioural risk profile ekakata SHAP-based XAI
  //      explanation fetch karannawa. Explanation eka dakwannawa MOKAKDA
  //      features (e.g. toxic_count, severity_score, warning_level)
  //      predicted risk score ekata wada bala thiyanawa kiyala, saha
  //      eya increases_risk da decreases_risk da kiyala.
  //      Admin dashboard eke moderator transparency walata dakwannawa.
  async getXaiExplanation(profileId: string): Promise<XaiExplanation> {
    return apiCall<XaiExplanation>(`/behavior/profiles/${profileId}/xai-explanation/`, { method: 'GET' });
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

  // GET /api/behavior/events/
  async getEvents(params: EventsParams = {}): Promise<PaginatedResponse<BehaviorEvent>> {
    const q = new URLSearchParams();
    if (params.user_id) q.append('user_id', params.user_id);
    if (params.event_type) q.append('event_type', params.event_type);
    if (params.content_type) q.append('content_type', params.content_type);
    if (params.page) q.append('page', String(params.page));
    if (params.page_size) q.append('page_size', String(params.page_size));
    const raw = await apiCall<any>(`/behavior/events/${q.toString() ? `?${q}` : ''}`, { method: 'GET' });
    return normalisePaginated<BehaviorEvent>(raw);
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
  async getSNANodes(params?: { node_type?: NodeType; sort?: string }): Promise<SNANode[]> {
    const q = new URLSearchParams();
    if (params?.node_type) q.append('node_type', params.node_type);
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
};

// ─────────────────────────────────────────────────────────────────
// Transform / Display Helpers
//
// [EN] Pure utility functions that transform raw API data into
//      display-ready formats for charts, tables, and labels.
//      No API calls are made here.
//
// [SL] Meka pure utility functions. Raw API data eka charts, tables,
//      saha labels walata display-ready formats ekakata transform
//      karannawa. Mehemath API calls nehe.
// ─────────────────────────────────────────────────────────────────

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

/**
 * [EN] Mirrors the backend OFFENSE_MULTIPLIER logic from models.py.
 *      As a user accumulates more toxic offences, the system progressively
 *      lowers the toxicity threshold required to trigger an intervention.
 *      This is a core mechanic of the adaptive shielding strategy (3.6):
 *      repeat offenders are scrutinised more strictly.
 *
 * [SL] Backend eke models.py eke OFFENSE_MULTIPLIER logic eka mirror karannawa.
 *      User ge toxic offences eka wada wena wita, intervention trigger
 *      karanna ona toxicity threshold eka progressively adhu karannawa.
 *      Meka adaptive shielding strategy (3.6) eke core mechanic ekak:
 *      repeat offenders lata wada strict widihata check karannawa.
 *
 *  Multiplier map: 0 offences → 1.0x | 1 → 1.3x | 2 → 1.8x | 3 → 2.5x | 4+ → 4.0x
 *  [SL] 0 violations → 1.0x | 1 → 1.3x | 2 → 1.8x | 3 → 2.5x | 4+ → 4.0x
 */
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

/**
 * [EN] Computes average category scores across all non-allowed behavioural events.
 *      Category weights mirror backend services.py CATEGORY_WEIGHTS.
 *      Used in the XAI dashboard (Section 3.7) to show which toxicity
 *      categories drove the most harm across the platform.
 *
 * [SL] Non-allowed behavioural events hama ekakata average category scores
 *      calculate karannawa. Backend services.py CATEGORY_WEIGHTS mirror karannawa.
 *      XAI dashboard eke (Section 3.7) dakkannawa mona toxicity categories
 *      wada harm karanawa kiyala.
 */
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
  };
}

export default behaviorAPI;