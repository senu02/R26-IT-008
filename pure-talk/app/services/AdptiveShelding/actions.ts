// ============================================================
// app/services/AdptiveShelding/actions.ts
// Section 3.6 — Adaptive Emotional Shielding Strategy (AESM)
// ============================================================
//
// [EN] This module is responsible for the Adaptive Emotional Shielding
//      strategy layer of the AESM system. Based on the toxicity score
//      and behavioural analysis, the system dynamically selects the
//      most appropriate intervention to minimise psychological harm
//      while still allowing meaningful communication.
//
// [SL] Meka AESM system eke Adaptive Emotional Shielding strategy
//      layer eka. Toxicity score ekata saha behavioral analysis ekata
//      anuwa, system eka automatic widihata correct intervention
//      select karala users lata harm wenna denna bae widihat balagannawa.
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ─────────────────────────────────────────────
// Core API caller
// ─────────────────────────────────────────────

/**
 * [EN] Generic authenticated API caller used by all shielding endpoints.
 *      Attaches the user's auth token and handles session expiry gracefully.
 *
 * [SL] Meka generic API caller eka. Shielding endpoints hama ekama meka use
 *      karannawa. User ge auth token attach karala, session expire unama
 *      proper widihat handle karannawa.
 */
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Token ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (options.headers) Object.assign(headers, options.headers as Record<string, string>);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // [EN] If the session has expired, clear local storage and force re-login.
  // [SL] Session expire unama local storage clear karala login page ekata yawannawa.
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
// Types — Shielding Strategy Definitions
// ─────────────────────────────────────────────

/**
 * [EN] Defines the five adaptive intervention strategies available
 *      in the AESM decision engine. Each strategy targets a different
 *      level of toxicity severity to protect the user emotionally.
 *
 * [SL] AESM decision engine eke thiyana panca (5) intervention strategies
 *      define karannawa. Toxicity severity level ekata anuwa correct
 *      strategy eka select wenawa.
 *
 *  - 'filter'   → [EN] Completely hides highly toxic messages from view.
 *                 [SL] Toxicity beshi una messages puraya hide karannawa.
 *
 *  - 'blur'     → [EN] Blurs sensitive/offensive words but keeps context.
 *                 [SL] Offensive words blur karannawa, message eka pura kiyawanna puluwan.
 *
 *  - 'warn'     → [EN] Shows a warning notification so the user can decide.
 *                 [SL] User lata warning notification dakkannawa, ohu/oha decide karannawa.
 *
 *  - 'rewrite'  → [EN] Automatically rewrites aggressive text into neutral tone.
 *                 [SL] Aggressive messages AI walin neutral tone ekakata rewrite karannawa.
 *
 *  - 'support'  → [EN] Sends emotional support or guidance to the affected user.
 *                 [SL] Harm wuna user lata supportive response ekak pathkarannawa.
 */
export type ShieldingStrategy = 'filter' | 'blur' | 'warn' | 'rewrite' | 'support';

/**
 * [EN] Severity thresholds used by the decision engine to pick a strategy.
 *      These mirror the backend threshold config in adaptive_shielding/config.py.
 *
 * [SL] Decision engine eka strategy eka select karanna use karanne meka.
 *      Backend eke adaptive_shielding/config.py eke thiyana thresholds
 *      mirroring karannawa.
 */
export const SHIELDING_THRESHOLDS = {
  // [EN] Score >= 0.85 → message completely filtered (most harmful)
  // [SL] Score 0.85 ta wada una message puraya filter wenawa (ewa beshi dangerous)
  FILTER:  0.85,

  // [EN] Score >= 0.65 → offensive words blurred to reduce harm
  // [SL] Score 0.65 ta wada una message eke words blur wenawa
  BLUR:    0.65,

  // [EN] Score >= 0.45 → user is warned, content remains visible
  // [SL] Score 0.45 ta wada una user lata warn karanawa, message thamai dakkannawa
  WARN:    0.45,

  // [EN] Score >= 0.30 → aggressive tone rewritten into neutral language
  // [SL] Score 0.30 ta wada una message AI walata neutral eka karanawa
  REWRITE: 0.30,

  // [EN] Score < 0.30  → emotional support offered to the recipient
  // [SL] Score 0.30 ta yata una user lata emotional support pathkarannawa
  SUPPORT: 0.00,
} as const;

/**
 * [EN] Payload returned by the backend after evaluating a shielding request.
 *      Contains the recommended strategy, the (optionally rewritten) content,
 *      and the contextual reason why that strategy was chosen.
 *
 * [SL] Backend eka shielding request evaluate karala denne meka. Recommended
 *      strategy eka, rewritten content eka (thiyanawa nam), saha strategy eka
 *      select karana reason eka denna kiyala return karannawa.
 */
export interface ShieldingDecision {
  /** [EN] The strategy the decision engine selected. [SL] Engine eka select kara strategy */
  strategy: ShieldingStrategy;

  /** [EN] Original content submitted for evaluation. [SL] Evaluate karanna yawana original text */
  original_content: string;

  /**
   * [EN] Processed content — for 'rewrite' this is the neutral version;
   *      for 'blur' it has masked words; otherwise same as original.
   * [SL] Processed content — rewrite una nam neutral version, blur una nam
   *      masked version, nathnam original eka thamai.
   */
  processed_content: string;

  /** [EN] Toxicity score that triggered this decision. [SL] Meka decision trigger kala score */
  toxicity_score: number;

  /** [EN] Human-readable reason for choosing this strategy. [SL] Strategy select karana hinda */
  reason: string;

  /** [EN] Whether the shielding was applied automatically. [SL] Auto apply una da? */
  auto_applied: boolean;

  /** [EN] Timestamp of the shielding event. [SL] Shielding event eke time */
  created_at: string;
}

/**
 * [EN] Request body sent to the backend to evaluate and apply a shielding strategy.
 *
 * [SL] Backend ekata shielding strategy evaluate saha apply karanna yawana request body.
 */
export interface ShieldingRequest {
  /** [EN] The content to be evaluated. [SL] Evaluate karanna content */
  content: string;

  /** [EN] Context — 'post' or 'comment'. [SL] Content type eka — post da comment da */
  content_type: 'post' | 'comment';

  /** [EN] Optional: allow caller to override the auto-selected strategy. [SL] Manually strategy eka set karanna puluwan */
  override_strategy?: ShieldingStrategy;
}

/**
 * [EN] Paginated response wrapper — used for shielding event history.
 * [SL] Paginated response — shielding event history list karanna.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function normalisePaginated<T>(response: any): Promise<PaginatedResponse<T>> {
  if (response?.results && Array.isArray(response.results)) return response as PaginatedResponse<T>;
  if (Array.isArray(response)) return { count: response.length, next: null, previous: null, results: response };
  return { count: 0, next: null, previous: null, results: [] };
}

// ─────────────────────────────────────────────────────────────
// Section 3.6 — Adaptive Emotional Shielding API Methods
// ─────────────────────────────────────────────────────────────
//
// [EN] The shieldingAPI object exposes all endpoints related to the
//      AESM adaptive intervention pipeline. Each method corresponds to
//      a backend route in adaptive_shielding/views.py.
//
// [SL] shieldingAPI object eka AESM adaptive intervention pipeline eke
//      endpoints hama ekama expose karannawa. Methanin backend eke
//      adaptive_shielding/views.py route ekak saha sambandha wenawa.
// ─────────────────────────────────────────────────────────────

export const shieldingAPI = {

  // ── Strategy 1: Message Filtering ────────────────────────────
  // POST /api/shielding/evaluate/
  //
  // [EN] Sends content to the decision engine. The engine evaluates
  //      toxicity severity and context, then returns the optimal
  //      shielding decision (filter / blur / warn / rewrite / support).
  //
  // [SL] Content eka decision engine ekata pathkarannawa. Engine eka
  //      toxicity score saha context balala optimal strategy eka
  //      (filter / blur / warn / rewrite / support) return karannawa.
  async evaluate(data: ShieldingRequest): Promise<ShieldingDecision> {
    return apiCall<ShieldingDecision>('/shielding/evaluate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Strategy 2: Content Blurring ────────────────────────────
  // POST /api/shielding/blur/
  //
  // [EN] Directly requests the blur intervention for a specific piece
  //      of content. Offensive or sensitive words are masked (e.g. f***).
  //      Used when the caller wants to force blur without full evaluation.
  //
  // [SL] Specific content ekakata directly blur intervention request karannawa.
  //      Offensive words mask wenawa (e.g. f***). Full evaluation nathuwama
  //      force blur karanna one nam use karannawa.
  async blurContent(content: string, contentType: 'post' | 'comment'): Promise<ShieldingDecision> {
    return apiCall<ShieldingDecision>('/shielding/blur/', {
      method: 'POST',
      body: JSON.stringify({ content, content_type: contentType, override_strategy: 'blur' }),
    });
  },

  // ── Strategy 3: Warning Notifications ───────────────────────
  // POST /api/shielding/warn/
  //
  // [EN] Triggers a warning notification for the receiving user.
  //      The message is still shown but a clear alert banner is
  //      displayed to inform the user of potentially harmful content.
  //
  // [SL] Receiving user lata warning notification trigger karannawa.
  //      Message thamai dakkannawa, bat ekkat harmful content gena
  //      alert banner ekak dakkannawa.
  async warnUser(content: string, contentType: 'post' | 'comment'): Promise<ShieldingDecision> {
    return apiCall<ShieldingDecision>('/shielding/warn/', {
      method: 'POST',
      body: JSON.stringify({ content, content_type: contentType, override_strategy: 'warn' }),
    });
  },

  // ── Strategy 4: Tone Rewriting ──────────────────────────────
  // POST /api/shielding/rewrite/
  //
  // [EN] Sends aggressive/offensive text to the AI rewriting service.
  //      The system automatically rewrites it in a neutral, respectful
  //      tone before delivering it to the recipient.
  //
  // [SL] Aggressive text eka AI rewriting service ekata pathkarannawa.
  //      System eka automatically neutral, respectful tone ekakata rewrite
  //      karala recipient ekata deliver karannawa.
  async rewriteContent(content: string, contentType: 'post' | 'comment'): Promise<ShieldingDecision> {
    return apiCall<ShieldingDecision>('/shielding/rewrite/', {
      method: 'POST',
      body: JSON.stringify({ content, content_type: contentType, override_strategy: 'rewrite' }),
    });
  },

  // ── Strategy 5: Emotional Support Responses ────────────────
  // POST /api/shielding/support/
  //
  // [EN] Provides emotional support responses or mental health guidance
  //      to users who received harmful or distressing content.
  //      Aims to reduce the psychological impact on vulnerable users.
  //
  // [SL] Harmful content labunu users lata emotional support responses
  //      saha mental health guidance pathkarannawa. Vulnerable users lata
  //      psychological harm eka reduce karanna aim karannawa.
  async sendSupport(content: string, contentType: 'post' | 'comment'): Promise<ShieldingDecision> {
    return apiCall<ShieldingDecision>('/shielding/support/', {
      method: 'POST',
      body: JSON.stringify({ content, content_type: contentType, override_strategy: 'support' }),
    });
  },

  // ── Shielding History ───────────────────────────────────────
  // GET /api/shielding/history/
  //
  // [EN] Retrieves the paginated log of all shielding decisions made.
  //      Useful for admin review and audit trails.
  //
  // [SL] Mokotuwath shielding decisions made kara paginated log eka
  //      retrieve karannawa. Admin review saha audit trails walata
  //      helpful wenawa.
  async getHistory(page = 1, pageSize = 20): Promise<PaginatedResponse<ShieldingDecision>> {
    const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const raw = await apiCall<any>(`/shielding/history/?${q}`, { method: 'GET' });
    return normalisePaginated<ShieldingDecision>(raw);
  },
};

// ─────────────────────────────────────────────────────────────
// Decision Engine Helpers — Client-side strategy resolution
// ─────────────────────────────────────────────────────────────

/**
 * [EN] Client-side helper that mirrors the backend decision engine logic.
 *      Determines the appropriate shielding strategy purely based on the
 *      toxicity score, without making an API call.
 *      Use this for instant UI feedback before the backend confirms.
 *
 * [SL] Backend decision engine logic eka client-side mirror karanne meka.
 *      Toxicity score ekata anuwa API call ekak nathuwama strategy eka
 *      determine karannawa. Backend confirm wenakota thamai UI eka
 *      update wenna time nathna nisat, fast UI feedback walata use karannawa.
 */
export function resolveStrategy(toxicityScore: number): ShieldingStrategy {
  if (toxicityScore >= SHIELDING_THRESHOLDS.FILTER)  return 'filter';
  if (toxicityScore >= SHIELDING_THRESHOLDS.BLUR)    return 'blur';
  if (toxicityScore >= SHIELDING_THRESHOLDS.WARN)    return 'warn';
  if (toxicityScore >= SHIELDING_THRESHOLDS.REWRITE) return 'rewrite';
  return 'support';
}

/**
 * [EN] Returns a human-readable label and Singlish description for each strategy.
 *      Used in admin dashboards and moderator explanations.
 *
 * [SL] Hama strategy ekakata human-readable label saha Singlish description
 *      return karannawa. Admin dashboards saha moderator explanations walata use karannawa.
 */
export function getStrategyMeta(strategy: ShieldingStrategy): { label: string; singlish: string; color: string } {
  const map: Record<ShieldingStrategy, { label: string; singlish: string; color: string }> = {
    filter:  { label: 'Message Filtered',          singlish: 'Message eka puraya hide kala',          color: '#ef4444' },
    blur:    { label: 'Content Blurred',            singlish: 'Offensive words mask kala',             color: '#f97316' },
    warn:    { label: 'Warning Shown',              singlish: 'User lata warning dunnaa',              color: '#eab308' },
    rewrite: { label: 'Tone Rewritten (Neutral)',   singlish: 'Message eka neutral tone ekakata rewrote', color: '#3b82f6' },
    support: { label: 'Emotional Support Provided', singlish: 'User lata support pathkala',            color: '#22c55e' },
  };
  return map[strategy];
}

export default shieldingAPI;
