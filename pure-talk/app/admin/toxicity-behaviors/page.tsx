'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  ShieldCheck,
  Eye,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  BarChart2,
  Network,
  ListFilter,
  CalendarClock,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useThemeColors, ThemeProvider } from '@/context/adminTheme';
import behaviorAPI, {
  UserBehaviorProfile,
  BehaviorEvent,
  SNAGraph,
  SNASummary,
  WarningLevel,
  EventType,
  SuspendRequest,
  getWarningLevelLabel,
  getWarningLevelColor,
  getEventTypeColor,
  getNodeTypeColor,
  transformEventsToDailyData,
  transformProfilesToLevelData,
  transformEventsToTypeBreakdown,
  transformEventsToCategoryAverages,
  transformToOverviewStats,
  WARNING_LEVEL_ORDER,
} from '@/app/services/ToxicityBehaviors/actions';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, PointElement, LineElement
);

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────

const WarningBadge = ({ level }: { level: WarningLevel }) => {
  const color = getWarningLevelColor(level);
  const label = getWarningLevelLabel(level);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}
    >
      {label}
    </span>
  );
};

const EventBadge = ({ type }: { type: EventType }) => {
  const color = getEventTypeColor(type);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium border capitalize"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}
    >
      {type}
    </span>
  );
};

const ScoreBar = ({ score, max = 1 }: { score: number; max?: number }) => {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f97316' : pct >= 40 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
};

const StatCard = ({
  title, value, icon: Icon, color, sub, trend,
}: {
  title: string; value: string | number; icon: any; color: string; sub?: string; trend?: 'up' | 'down';
}) => {
  const { colors } = useThemeColors();
  return (
    <div
      className="rounded-xl border p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon size={16} />
        </div>
        {trend && (
          trend === 'up'
            ? <TrendingUp size={13} style={{ color: '#ef4444' }} />
            : <TrendingDown size={13} style={{ color: '#22c55e' }} />
        )}
      </div>
      <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>{title}</div>
      {sub && <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>{sub}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Suspend Modal
// ─────────────────────────────────────────────

const SuspendModal = ({
  profile,
  onClose,
  onConfirm,
}: {
  profile: UserBehaviorProfile;
  onClose: () => void;
  onConfirm: (data: SuspendRequest) => Promise<void>;
}) => {
  const { colors } = useThemeColors();
  const [hours, setHours] = useState(24);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmError, setConfirmError] = useState('');

  const handleConfirm = async () => {
    setSaving(true);
    setConfirmError('');
    try {
      await onConfirm({ hours, reason: reason || 'Manual suspension by admin.' });
      // onConfirm (handleSuspend) closes modal by clearing suspendingProfile
      onClose();
    } catch (err: any) {
      setConfirmError(err?.message || 'Failed to suspend user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 rounded-2xl border shadow-2xl"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border.primary }}>
          <h2 className="font-semibold text-base" style={{ color: colors.text.primary }}>
            Suspend User
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: colors.text.tertiary }} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}
          >
            Suspending <strong style={{ color: colors.text.primary }}>
              {profile.user_email}
            </strong> — currently {profile.toxic_count} violation(s), warning level:{' '}
            <strong>{getWarningLevelLabel(profile.warning_level)}</strong>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: colors.text.tertiary }}>
              Duration (hours)
            </label>
            <div className="flex gap-2">
              {[1, 6, 24, 48, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className="flex-1 py-1.5 text-xs rounded-lg border transition-all"
                  style={{
                    backgroundColor: hours === h ? colors.primary.main : 'transparent',
                    color: hours === h ? colors.primary.contrast : colors.text.secondary,
                    borderColor: hours === h ? colors.primary.main : colors.border.primary,
                  }}
                >
                  {h >= 168 ? '7d' : h >= 48 ? '2d' : h >= 24 ? '1d' : `${h}h`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: colors.text.tertiary }}>
              Reason (optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Manual suspension by admin."
              className="w-full text-sm p-3 rounded-lg border resize-none focus:outline-none"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
                color: colors.text.primary,
              }}
            />
          </div>

          {confirmError && (
            <div className="p-3 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-400">
              ⚠️ {confirmError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: colors.border.primary }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border"
            style={{ borderColor: colors.border.primary, color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            {saving && <RefreshCw size={13} className="animate-spin" />}
            <Ban size={13} />
            Suspend {hours >= 168 ? '7 days' : hours >= 24 ? `${hours / 24}d` : `${hours}h`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

const Pagination = ({
  page, total, pageSize, onChange,
}: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) => {
  const { colors } = useThemeColors();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs" style={{ color: colors.text.tertiary }}>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1.5 rounded disabled:opacity-30">
          <ChevronLeft size={15} style={{ color: colors.text.primary }} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="w-7 h-7 text-xs rounded-lg"
            style={{
              backgroundColor: p === page ? colors.primary.main : 'transparent',
              color: p === page ? colors.primary.contrast : colors.text.secondary,
            }}
          >
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded disabled:opacity-30">
          <ChevronRight size={15} style={{ color: colors.text.primary }} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Profile detail drawer
// ─────────────────────────────────────────────

const ProfileDrawer = ({
  profile,
  events,
  onClose,
  onSuspend,
  onLift,
}: {
  profile: UserBehaviorProfile;
  events: BehaviorEvent[];
  onClose: () => void;
  onSuspend: () => void;
  onLift: () => Promise<void>;
}) => {
  const { colors } = useThemeColors();
  const [liftLoading, setLiftLoading] = useState(false);

  const userEvents = events.filter((e) => e.user === profile.user).slice(0, 8);

  const handleLift = async () => {
    setLiftLoading(true);
    try { await onLift(); onClose(); } finally { setLiftLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg h-full overflow-y-auto border-l shadow-2xl"
        style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: colors.text.primary }}>
              {profile.user_email.split('@')[0]}
            </h2>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>{profile.user_email}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: colors.text.tertiary }} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Warning + threshold */}
          <div className="flex items-center gap-3">
            <WarningBadge level={profile.warning_level} />
            {profile.is_currently_suspended && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-500/15 text-red-400 border-red-500/30">
                Suspended
              </span>
            )}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total violations', value: profile.toxic_count },
              { label: 'Times blocked', value: profile.blocked_count },
              { label: 'Warnings issued', value: profile.warning_count },
              { label: 'Avg severity', value: `${Math.round(profile.severity_score * 100)}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
              >
                <p className="text-xs mb-1" style={{ color: colors.text.tertiary }}>{label}</p>
                <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Effective threshold — mirrors backend model logic */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: colors.text.secondary }}>Effective threshold</span>
              <span className="text-xs font-semibold" style={{ color: colors.primary.main }}>
                {profile.effective_threshold.toFixed(2)} (base: 0.50)
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${profile.effective_threshold * 100}%`, backgroundColor: colors.primary.main }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
              Lower threshold = more sensitive. Escalates with each violation.
            </p>
          </div>

          {/* Suspension info */}
          {profile.is_currently_suspended && profile.suspended_until && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
              <p className="text-xs font-medium text-red-400 mb-1">Active suspension</p>
              <p className="text-xs text-red-300">
                Until: {new Date(profile.suspended_until).toLocaleString()}
              </p>
              {profile.suspension_reason && (
                <p className="text-xs text-red-300 mt-1">Reason: {profile.suspension_reason}</p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 text-xs" style={{ color: colors.text.tertiary }}>
            {profile.first_offence_at && (
              <p>First offence: {new Date(profile.first_offence_at).toLocaleDateString()}</p>
            )}
            {profile.last_offence_at && (
              <p>Last offence: {new Date(profile.last_offence_at).toLocaleDateString()}</p>
            )}
          </div>

          {/* Recent events for this user */}
          {userEvents.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>
                Recent events
              </h3>
              <div className="space-y-2">
                {userEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
                  >
                    <EventBadge type={e.event_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: colors.text.secondary }}>
                        {e.analysed_text}
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                        Score: {Math.round(e.toxicity_score * 100)}% · Threshold: {Math.round(e.threshold_used * 100)}%
                      </p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: colors.text.tertiary }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {profile.is_currently_suspended ? (
              <button
                onClick={handleLift}
                disabled={liftLoading}
                className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                {liftLoading ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Lift suspension
              </button>
            ) : (
              <button
                onClick={onSuspend}
                className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <Ban size={13} />
                Suspend user
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SNA Summary card
// ─────────────────────────────────────────────

const SNACard = ({ summary }: { summary: SNASummary | null }) => {
  const { colors } = useThemeColors();
  if (!summary) return null;

  const toxicPct = summary.total_nodes > 0
    ? Math.round((summary.toxic_nodes / summary.total_nodes) * 100)
    : 0;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Social Network Analysis
          </h3>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Interaction graph summary
          </p>
        </div>
        <Network size={16} style={{ color: colors.text.tertiary }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total nodes', value: summary.total_nodes },
          { label: 'Toxic nodes', value: summary.toxic_nodes, color: '#ef4444' },
          { label: 'At-risk nodes', value: summary.at_risk_nodes, color: '#f97316' },
          { label: 'Total edges', value: summary.total_edges },
          { label: 'Toxic edges', value: summary.toxic_edges, color: '#ef4444' },
          { label: 'Avg clustering', value: summary.avg_clustering.toFixed(2) },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-2.5 rounded-lg text-center"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <p
              className="text-lg font-bold"
              style={{ color: (color as string) || colors.text.primary }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Toxic node % */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Toxic node ratio</span>
          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{toxicPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${toxicPct}%`, backgroundColor: '#ef4444' }} />
        </div>
      </div>

      {/* Contagion candidates */}
      {summary.contagion_candidates?.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border.primary }}>
          <p className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>
            Contagion risk users ({summary.contagion_candidates.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.contagion_candidates.slice(0, 5).map((c: any, i: number) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#ef444418', color: '#ef4444' }}
              >
                {c.username ?? c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

function ToxicityBehaviorContent() {
  const { colors } = useThemeColors();

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [profiles, setProfiles] = useState<UserBehaviorProfile[]>([]);
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [snaSummary, setSnaSummary] = useState<SNASummary | null>(null);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<'profiles' | 'events' | 'sna'>('profiles');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profilesPage, setProfilesPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);

  const [selectedProfile, setSelectedProfile] = useState<UserBehaviorProfile | null>(null);
  const [suspendingProfile, setSuspendingProfile] = useState<UserBehaviorProfile | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) { setError('No authentication token. Please login.'); return; }

      const [profilesRes, eventsRes] = await Promise.all([
        behaviorAPI.getProfiles({ page_size: 200 }),
        behaviorAPI.getEvents({ page_size: 300 }),
      ]);

      setProfiles(profilesRes.results);
      setEvents(eventsRes.results);

      // SNA summary — non-critical, don't fail the whole load
      try {
        const sna = await behaviorAPI.getSNASummary();
        setSnaSummary(sna);
      } catch {
        // SNA might not have data yet — silently skip
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load behavior data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  // ── Actions ──
  const handleSuspend = useCallback(async (profileId: string, data: SuspendRequest) => {
    await behaviorAPI.suspendUser(profileId, data);
    const res = await behaviorAPI.getProfiles({ page_size: 200 });
    setProfiles(res.results);
    setSuspendingProfile(null);
    // Update drawer if it was open for this profile
    setSelectedProfile((prev) =>
      prev?.id === profileId ? (res.results.find((p) => p.id === profileId) ?? null) : prev
    );
  }, []);

  const handleLiftSuspension = useCallback(async (profileId: string) => {
    await behaviorAPI.liftSuspension(profileId);
    const res = await behaviorAPI.getProfiles({ page_size: 200 });
    setProfiles(res.results);
    // Update drawer if it was open for this profile
    setSelectedProfile((prev) =>
      prev?.id === profileId ? (res.results.find((p) => p.id === profileId) ?? null) : prev
    );
  }, []);

  // ── Derived data ──
  const overviewStats = useMemo(() => transformToOverviewStats(profiles, events), [profiles, events]);
  const levelData    = useMemo(() => transformProfilesToLevelData(profiles), [profiles]);
  const eventBreak   = useMemo(() => transformEventsToTypeBreakdown(events), [events]);
  const dailyData    = useMemo(() => transformEventsToDailyData(events), [events]);
  const catAverages  = useMemo(() => transformEventsToCategoryAverages(events), [events]);

  // ── Filtered profiles ──
  const filteredProfiles = useMemo(() => profiles.filter((p) => {
    if (levelFilter !== 'all' && p.warning_level !== levelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.user_email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [profiles, levelFilter, searchQuery]);

  const paginatedProfiles = useMemo(
    () => filteredProfiles.slice((profilesPage - 1) * PAGE_SIZE, profilesPage * PAGE_SIZE),
    [filteredProfiles, profilesPage]
  );

  useEffect(() => setProfilesPage(1), [levelFilter, searchQuery]);

  // ── Filtered events ──
  const filteredEvents = useMemo(() => events.filter((e) => {
    if (eventTypeFilter !== 'all' && e.event_type !== eventTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.user_email.toLowerCase().includes(q) && !e.analysed_text.toLowerCase().includes(q))
        return false;
    }
    return true;
  }), [events, eventTypeFilter, searchQuery]);

  const paginatedEvents = useMemo(
    () => filteredEvents.slice((eventsPage - 1) * PAGE_SIZE, eventsPage * PAGE_SIZE),
    [filteredEvents, eventsPage]
  );

  useEffect(() => setEventsPage(1), [eventTypeFilter, searchQuery]);

  // ── Chart objects ──
  const sharedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.surface.primary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.primary,
        borderWidth: 1,
      },
    },
  };

  const levelChartData = {
    labels: levelData.labels,
    datasets: [{
      data: levelData.data,
      backgroundColor: levelData.colors.map((c) => `${c}cc`),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const eventBreakData = {
    labels: eventBreak.labels,
    datasets: [{
      data: eventBreak.data,
      backgroundColor: eventBreak.colors.map((c) => `${c}cc`),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const dailyChartData = {
    labels: dailyData.labels,
    datasets: [
      { label: 'Blocked', data: dailyData.blocked, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 5, barPercentage: 0.6 },
      { label: 'Warned', data: dailyData.warned, backgroundColor: 'rgba(234,179,8,0.85)', borderRadius: 5, barPercentage: 0.6 },
      { label: 'Suspended', data: dailyData.suspended, backgroundColor: 'rgba(124,58,237,0.85)', borderRadius: 5, barPercentage: 0.6 },
      { label: 'Allowed', data: dailyData.allowed, backgroundColor: 'rgba(34,197,94,0.4)', borderRadius: 5, barPercentage: 0.6 },
    ],
  };

  const catChartData = {
    labels: catAverages.labels,
    datasets: [{
      label: 'Avg score',
      data: catAverages.data,
      backgroundColor: 'rgba(239,68,68,0.7)',
      borderRadius: 5,
      barPercentage: 0.65,
    }],
  };

  // ── Loading/Error ──
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto"
            style={{ borderColor: colors.primary.main, borderTopColor: 'transparent' }} />
          <p className="mt-4 text-sm" style={{ color: colors.text.secondary }}>Loading behavior data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center max-w-md p-6 rounded-xl border border-red-500/20" style={{ backgroundColor: colors.surface.primary }}>
          <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Failed to load</h2>
          <p className="text-sm mb-5" style={{ color: colors.text.secondary }}>{error}</p>
          <button onClick={() => fetchData()} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
            style={{ backgroundColor: colors.primary.main, color: 'white' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="space-y-6 pb-10" style={{ backgroundColor: colors.background.primary }}>

      {/* Modals / drawers */}
      {selectedProfile && (
        <ProfileDrawer
          profile={selectedProfile}
          events={events}
          onClose={() => setSelectedProfile(null)}
          onSuspend={() => { setSuspendingProfile(selectedProfile); setSelectedProfile(null); }}
          onLift={() => handleLiftSuspension(selectedProfile.id)}
        />
      )}
      {suspendingProfile && (
        <SuspendModal
          profile={suspendingProfile}
          onClose={() => setSuspendingProfile(null)}
          onConfirm={(data) => handleSuspend(suspendingProfile.id, data)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Behavior Enforcement
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: colors.text.secondary }}>
            Track user warning levels, enforcement events, and network analysis.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="px-3 py-2 rounded-lg text-sm border flex items-center gap-2 transition-all hover:opacity-70"
          style={{ borderColor: colors.border.primary, color: colors.text.secondary }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total profiles" value={overviewStats.totalProfiles} icon={Users} color="#8b5cf6" />
        <StatCard title="Total violations" value={overviewStats.totalViolations} icon={AlertTriangle} color="#ef4444" trend="up" />
        <StatCard title="Events blocked" value={overviewStats.totalBlocked} icon={Ban} color="#ef4444" trend="up" />
        <StatCard title="Currently suspended" value={overviewStats.totalSuspended} icon={CalendarClock} color="#7c3aed" trend="up" />
        <StatCard title="At risk users" value={overviewStats.atRisk} icon={Zap} color="#f97316" sub="moderate + severe" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Warning level doughnut */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
          <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>Warning levels</h3>
          <p className="text-xs mb-3" style={{ color: colors.text.tertiary }}>User distribution</p>
          <div style={{ height: 180 }}>
            <Doughnut data={levelChartData} options={{ ...sharedOpts, cutout: '65%' }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {levelData.labels.map((label, i) => (
              <span key={label} className="flex items-center gap-1 text-xs" style={{ color: colors.text.secondary }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: levelData.colors[i] }} />
                {label} ({levelData.data[i]})
              </span>
            ))}
          </div>
        </div>

        {/* Event type doughnut */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
          <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>Event outcomes</h3>
          <p className="text-xs mb-3" style={{ color: colors.text.tertiary }}>All enforcement decisions</p>
          <div style={{ height: 180 }}>
            <Doughnut data={eventBreakData} options={{ ...sharedOpts, cutout: '65%' }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {eventBreak.labels.map((label, i) => (
              <span key={label} className="flex items-center gap-1 text-xs" style={{ color: colors.text.secondary }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: eventBreak.colors[i] }} />
                {label} ({eventBreak.data[i]})
              </span>
            ))}
          </div>
        </div>

        {/* Daily stacked bar */}
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
          <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>Daily enforcement</h3>
          <p className="text-xs mb-3" style={{ color: colors.text.tertiary }}>Blocked / warned / suspended by day</p>
          <div className="flex gap-4 mb-3">
            {['Blocked', 'Warned', 'Suspended'].map((l, i) => {
              const c = ['#ef4444', '#eab308', '#7c3aed'][i];
              return (
                <span key={l} className="flex items-center gap-1 text-xs" style={{ color: colors.text.secondary }}>
                  <span className="w-2 h-2 rounded flex-shrink-0" style={{ backgroundColor: c }} />
                  {l}
                </span>
              );
            })}
          </div>
          <div style={{ height: 200 }}>
            <Bar
              data={dailyChartData}
              options={{
                ...sharedOpts,
                scales: {
                  x: { stacked: true, grid: { display: false }, ticks: { color: colors.text.tertiary, font: { size: 11 } } },
                  y: { stacked: true, grid: { color: `${colors.border.primary}60` }, ticks: { color: colors.text.tertiary, font: { size: 11 } }, beginAtZero: true },
                },
              } as any}
            />
          </div>
        </div>
      </div>

      {/* Category averages + SNA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category scores bar */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
          <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>
            Avg category scores (blocked events)
          </h3>
          <p className="text-xs mb-4" style={{ color: colors.text.tertiary }}>
            Weighted per CATEGORY_WEIGHTS from enforcement service
          </p>
          <div style={{ height: 220 }}>
            <Bar
              data={catChartData}
              options={{
                ...sharedOpts,
                indexAxis: 'y' as const,
                scales: {
                  x: { grid: { color: `${colors.border.primary}60` }, ticks: { color: colors.text.tertiary, font: { size: 11 } }, min: 0, max: 1 },
                  y: { grid: { display: false }, ticks: { color: colors.text.tertiary, font: { size: 11 } } },
                },
              }}
            />
          </div>
        </div>

        {/* SNA summary */}
        <SNACard summary={snaSummary} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b mb-4" style={{ borderColor: colors.border.primary }}>
          {[
            { key: 'profiles', label: 'Behavior profiles', icon: Users, count: profiles.length },
            { key: 'events',   label: 'Event log',         icon: ListFilter, count: events.length },
            { key: 'sna',      label: 'Network nodes',     icon: Network, count: snaSummary?.total_nodes ?? 0 },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
              style={{
                borderBottomColor: activeTab === key ? colors.primary.main : 'transparent',
                color: activeTab === key ? colors.primary.main : colors.text.secondary,
              }}
            >
              <Icon size={14} />
              {label}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${colors.primary.main}20`, color: colors.primary.main }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar — shared */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} />
            <input
              type="text"
              placeholder={activeTab === 'events' ? 'Search email or content…' : 'Search by email…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-none"
              style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary, color: colors.text.primary }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={12} style={{ color: colors.text.tertiary }} />
              </button>
            )}
          </div>

          {activeTab === 'profiles' && (
            <>
              <Filter size={13} style={{ color: colors.text.tertiary }} />
              {(['all', ...WARNING_LEVEL_ORDER] as string[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{
                    backgroundColor: levelFilter === level ? colors.primary.main : 'transparent',
                    color: levelFilter === level ? colors.primary.contrast : colors.text.secondary,
                    borderColor: levelFilter === level ? colors.primary.main : colors.border.primary,
                  }}
                >
                  {level === 'all' ? 'All levels' : getWarningLevelLabel(level as WarningLevel)}
                </button>
              ))}
            </>
          )}

          {activeTab === 'events' && (
            <>
              <Filter size={13} style={{ color: colors.text.tertiary }} />
              {(['all', 'allowed', 'warned', 'blocked', 'suspended'] as string[]).map((et) => (
                <button
                  key={et}
                  onClick={() => setEventTypeFilter(et)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all capitalize"
                  style={{
                    backgroundColor: eventTypeFilter === et ? colors.primary.main : 'transparent',
                    color: eventTypeFilter === et ? colors.primary.contrast : colors.text.secondary,
                    borderColor: eventTypeFilter === et ? colors.primary.main : colors.border.primary,
                  }}
                >
                  {et === 'all' ? 'All types' : et}
                </button>
              ))}
            </>
          )}
        </div>

        {/* ── Profiles tab ── */}
        {activeTab === 'profiles' && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
              <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>Behavior profiles</h3>
              <span className="text-xs" style={{ color: colors.text.tertiary }}>{filteredProfiles.length} users</span>
            </div>
            <div className="overflow-x-auto">
              {paginatedProfiles.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
                  <p className="text-sm" style={{ color: colors.text.secondary }}>No profiles match the filter</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: colors.background.secondary }}>
                    <tr>
                      {['User', 'Warning level', 'Violations', 'Blocked', 'Severity', 'Threshold', 'Status', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: colors.text.tertiary }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProfiles.map((p) => (
                      <tr key={p.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: colors.border.light }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: `${colors.primary.main}25`, color: colors.primary.main }}
                            >
                              {(p.user_email?.[0] ?? 'U').toUpperCase()}
                            </div>
                            <div>
                              <p style={{ color: colors.text.primary }}>{p.user_email.split('@')[0]}</p>
                              <p className="text-xs" style={{ color: colors.text.tertiary }}>{p.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><WarningBadge level={p.warning_level} /></td>
                        <td className="px-4 py-3"><span style={{ color: colors.text.primary }}>{p.toxic_count}</span></td>
                        <td className="px-4 py-3"><span style={{ color: colors.text.primary }}>{p.blocked_count}</span></td>
                        <td className="px-4 py-3 min-w-28"><ScoreBar score={p.severity_score} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: colors.text.secondary }}>
                            {p.effective_threshold.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.is_currently_suspended ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-500/15 text-red-400 border-red-500/30">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-green-500/15 text-green-400 border-green-500/30">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedProfile(p)} className="p-1.5 rounded-lg hover:opacity-70" title="View details">
                              <Eye size={14} style={{ color: colors.text.tertiary }} />
                            </button>
                            {p.is_currently_suspended ? (
                              <button
                                onClick={async () => { await handleLiftSuspension(p.id); }}
                                className="p-1.5 rounded-lg hover:opacity-70"
                                title="Lift suspension"
                              >
                                <ShieldCheck size={14} style={{ color: '#22c55e' }} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspendingProfile(p)}
                                className="p-1.5 rounded-lg hover:opacity-70"
                                title="Suspend user"
                              >
                                <Ban size={14} style={{ color: '#ef4444' }} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination page={profilesPage} total={filteredProfiles.length} pageSize={PAGE_SIZE} onChange={setProfilesPage} />
          </div>
        )}

        {/* ── Events tab ── */}
        {activeTab === 'events' && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
              <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>Enforcement event log</h3>
              <span className="text-xs" style={{ color: colors.text.tertiary }}>{filteredEvents.length} events</span>
            </div>
            <div className="overflow-x-auto">
              {paginatedEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
                  <p className="text-sm" style={{ color: colors.text.secondary }}>No events match the filter</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: colors.background.secondary }}>
                    <tr>
                      {['User', 'Content', 'Outcome', 'Score', 'Threshold', 'Violations at event', 'Type', 'Time'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: colors.text.tertiary }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvents.map((e) => (
                      <tr key={e.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: colors.border.light }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: `${getEventTypeColor(e.event_type)}25`, color: getEventTypeColor(e.event_type) }}
                            >
                              {(e.user_email?.[0] ?? 'U').toUpperCase()}
                            </div>
                            <span style={{ color: colors.text.primary }}>{e.user_email.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="truncate text-xs" title={e.analysed_text} style={{ color: colors.text.secondary }}>
                            {e.analysed_text}
                          </p>
                        </td>
                        <td className="px-4 py-3"><EventBadge type={e.event_type} /></td>
                        <td className="px-4 py-3 min-w-24"><ScoreBar score={e.toxicity_score} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: colors.text.secondary }}>
                            {e.threshold_used.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: colors.text.secondary }}>
                            #{e.toxic_count_at_event} · <WarningBadge level={e.warning_level_at_event as WarningLevel} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize" style={{ color: colors.text.secondary }}>{e.content_type}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs" style={{ color: colors.text.tertiary }}>
                            {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination page={eventsPage} total={filteredEvents.length} pageSize={PAGE_SIZE} onChange={setEventsPage} />
          </div>
        )}

        {/* ── SNA nodes tab ── */}
        {activeTab === 'sna' && (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
              <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>Network nodes</h3>
              <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                Social network analysis — node centrality and influence metrics
              </p>
            </div>
            {!snaSummary ? (
              <div className="py-12 text-center">
                <Network size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  No SNA data available yet. Network builds once users start interacting.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { title: 'Top by degree', items: snaSummary.top_degree },
                    { title: 'Top by betweenness', items: snaSummary.top_betweenness },
                    { title: 'Top toxic ratio', items: snaSummary.top_toxic_ratio },
                  ].map(({ title, items }) => (
                    <div key={title} className="rounded-lg p-4" style={{ backgroundColor: colors.background.secondary }}>
                      <h4 className="text-xs font-medium mb-3" style={{ color: colors.text.secondary }}>{title}</h4>
                      {(items ?? []).slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-xs border-b last:border-0" style={{ borderColor: colors.border.primary }}>
                          <span style={{ color: colors.text.primary }}>{item.username ?? item}</span>
                          <span style={{ color: colors.text.tertiary }}>
                            {typeof item === 'object' ? Object.values(item).filter((v) => typeof v === 'number')[0]?.toFixed(3) : ''}
                          </span>
                        </div>
                      ))}
                      {(!items || items.length === 0) && (
                        <p className="text-xs" style={{ color: colors.text.tertiary }}>No data</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center" style={{ color: colors.text.tertiary }}>
                  For the full interactive graph, use <code className="bg-white/10 px-1 rounded">GET /api/behavior/sna/graph/</code>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToxicityBehaviorPage() {
  return (
    <ThemeProvider>
      <ToxicityBehaviorContent />
    </ThemeProvider>
  );
}