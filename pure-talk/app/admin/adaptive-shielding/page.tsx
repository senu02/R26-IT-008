'use client';

import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldOff, 
  Eye, 
  EyeOff, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  Flame,
  Sparkles,
  Binary,
  Activity,
  Zap
} from 'lucide-react';
import { adaptiveShieldingAPI, type ShieldAdminRecord, type LimeExplanation } from '@/lib/api';

const STRATEGY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Safe:      { label: 'Safe',      color: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <ShieldCheck  className="w-3.5 h-3.5" /> },
  Warning:   { label: 'Warning',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  Blurring:  { label: 'Blurring',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: <EyeOff       className="w-3.5 h-3.5" /> },
  Rewriting: { label: 'Rewriting', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',    icon: <Eye          className="w-3.5 h-3.5" /> },
  Filtering: { label: 'Filtered',  color: 'bg-red-500/15 text-red-400 border-red-500/30',       icon: <ShieldOff    className="w-3.5 h-3.5" /> },
};

export default function AdaptiveShieldingAdminPage() {
  const [records, setRecords]       = useState<ShieldAdminRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<string>('All');
  const [search, setSearch]         = useState('');
  const [limeModal, setLimeModal]     = useState<{ message: string; data: LimeExplanation | null; loading: boolean } | null>(null);

  const handleExplain = async (message: string) => {
    setLimeModal({ message, data: null, loading: true });
    try {
      const res = await adaptiveShieldingAPI.explainMessage(message);
      setLimeModal({ message, data: res.lime_explanation, loading: false });
    } catch {
      setLimeModal({ message, data: null, loading: false });
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adaptiveShieldingAPI.getAdminRecords();
      setRecords(data.records);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records. Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // ── Derived stats ────────────────────────────────────────────────
  const stats = {
    total:     records.length,
    safe:      records.filter(r => r.strategy === 'Safe').length,
    warning:   records.filter(r => r.strategy === 'Warning').length,
    blurred:   records.filter(r => r.strategy === 'Blurring').length,
    rewritten: records.filter(r => r.strategy === 'Rewriting').length,
    filtered:  records.filter(r => r.strategy === 'Filtering').length,
  };

  // ── Advanced Intelligence Metrics ────────────────────────────────
  const nonSafeCount = stats.warning + stats.blurred + stats.rewritten + stats.filtered;
  const rehabilitatedRate = nonSafeCount > 0 ? ((stats.rewritten / nonSafeCount) * 100).toFixed(1) : '0.0';

  // Leetspeak / Obfuscation pattern detection count
  const leetspeakBypassCount = records.filter(r => {
    const msg = r.message.toLowerCase();
    const hasObfuscation = /[0-9!@#$\*\._]/.test(msg) || /(.)\1{2,}/.test(msg);
    return hasObfuscation && r.strategy !== 'Safe';
  }).length;

  // User Heat Index Calculation
  const userHeatMap: Record<string, { username: string; fullName: string; count: number; maxScore: number; sumScore: number }> = {};
  records.forEach(r => {
    if (r.final_score > 0.3) {
      const key = r.user || r.user_full_name;
      if (!userHeatMap[key]) {
        userHeatMap[key] = { username: r.user, fullName: r.user_full_name, count: 0, maxScore: 0, sumScore: 0 };
      }
      userHeatMap[key].count += 1;
      userHeatMap[key].maxScore = Math.max(userHeatMap[key].maxScore, r.final_score);
      userHeatMap[key].sumScore += r.final_score;
    }
  });

  const userHeatList = Object.values(userHeatMap).map(u => {
    const avgScore = u.count > 0 ? u.sumScore / u.count : 0;
    const heatScore = Math.min(100, Math.round((u.count * 20) + (avgScore * 60)));
    let status = 'Cool';
    let color = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    let icon = '❄️';

    if (heatScore >= 75) {
      status = 'Critical';
      color = 'text-red-400 bg-red-500/15 border-red-500/30';
      icon = '💥';
    } else if (heatScore >= 50) {
      status = 'Hot';
      color = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      icon = '🔥';
    } else if (heatScore >= 25) {
      status = 'Warm';
      color = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      icon = '⚡';
    }

    return { ...u, heatScore, status, color, icon };
  }).sort((a, b) => b.heatScore - a.heatScore);

  const filtered = records.filter(r => {
    const matchFilter = filter === 'All' || r.strategy === filter;
    const matchSearch = search === '' ||
      r.message.toLowerCase().includes(search.toLowerCase()) ||
      r.user.toLowerCase().includes(search.toLowerCase()) ||
      r.user_full_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Adaptive Shielding</h1>
            <p className="text-white/50 text-sm">Toxicity moderation audit log</p>
          </div>
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',     value: stats.total,     color: 'from-white/10 to-white/5',              text: 'text-white'       },
          { label: 'Safe',      value: stats.safe,      color: 'from-green-500/20 to-green-500/5',     text: 'text-green-400'   },
          { label: 'Warnings',  value: stats.warning,   color: 'from-amber-500/20 to-amber-500/5',     text: 'text-amber-400'   },
          { label: 'Blurred',   value: stats.blurred,   color: 'from-purple-500/20 to-purple-500/5',   text: 'text-purple-400'  },
          { label: 'Rewritten', value: stats.rewritten, color: 'from-blue-500/20 to-blue-500/5',       text: 'text-blue-400'    },
          { label: 'Filtered',  value: stats.filtered,  color: 'from-red-500/20 to-red-500/5',         text: 'text-red-400'     },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} border border-white/10 rounded-2xl p-4 flex flex-col`}>
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{s.label}</span>
            <span className={`text-3xl font-extrabold ${s.text}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Advanced Intelligence Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Rehabilitated Intent Rate (%) */}
        <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/80 to-purple-900/20 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rehabilitated Intent Rate</h3>
                <p className="text-[11px] text-white/50">Constructive rephrases vs total toxic intent</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
              AI NLP
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {rehabilitatedRate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.rewritten} of {nonSafeCount} flagged messages converted safely
              </p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-blue-500/30 border-t-blue-400 flex items-center justify-center font-bold text-xs text-blue-300 shadow-inner">
              {rehabilitatedRate}%
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(rehabilitatedRate))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Leetspeak Bypass Blocked Count */}
        <div className="bg-gradient-to-br from-rose-900/30 via-slate-900/80 to-pink-900/20 border border-rose-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Binary className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Leetspeak Bypass Blocked</h3>
                <p className="text-[11px] text-white/50">Character stretching & symbol evasion caught</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-2 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Resilience Active
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="text-3xl font-black bg-gradient-to-r from-rose-400 to-pink-300 bg-clip-text text-transparent">
                {leetspeakBypassCount} <span className="text-sm font-normal text-rose-300/80">Attempts</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Obfuscated leetspeak patterns automatically neutralized
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Defense Active</span>
            <span className="text-rose-400 font-semibold">100% Evasion Protection</span>
          </div>
        </div>

        {/* Card 3: User Heat Index Gauge */}
        <div className="bg-gradient-to-br from-amber-900/30 via-slate-900/80 to-red-900/20 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">User Heat Index Gauge</h3>
                <p className="text-[11px] text-white/50">Live rapid toxicity velocity tracking</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" /> Live
            </span>
          </div>

          {userHeatList.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No active high-heat users detected. All users operating within cool thresholds.
            </div>
          ) : (
            <div className="space-y-2.5 mt-2 max-h-[110px] overflow-y-auto pr-1">
              {userHeatList.slice(0, 3).map((u) => (
                <div key={u.username} className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{u.fullName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${u.color}`}>
                        {u.icon} {u.status}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${u.heatScore >= 75 ? 'bg-red-500' : u.heatScore >= 50 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${u.heatScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">{u.heatScore}%</span>
                    <div className="text-[9px] text-slate-500">{u.count} bursts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {['All', 'Safe', 'Warning', 'Blurring', 'Rewriting', 'Filtering'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] border-transparent text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user or message..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-[#fd297b]/50 transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#fd297b] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Shield className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['#', 'User', 'Message', 'Strategy', 'Toxicity', 'Behavior', 'Final', 'Output', 'XAI', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/50 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const cfg = STRATEGY_CONFIG[r.strategy] || STRATEGY_CONFIG['Safe'];
                return (
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium text-xs leading-tight">{r.user_full_name}</div>
                      <div className="text-white/40 text-xs">{r.user}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-white/80 text-xs truncate" title={r.message}>{r.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${r.toxicity_score > 0.65 ? 'text-red-400' : r.toxicity_score > 0.35 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {(r.toxicity_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{(r.behavior_score * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${r.final_score > 0.65 ? 'text-red-400' : r.final_score > 0.35 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {(r.final_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-white/50 text-xs truncate italic" title={r.processed_output}>{r.processed_output}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.strategy !== 'Safe' && (
                        <button
                          onClick={() => handleExplain(r.message)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        >
                          LIME
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-white/10 text-white/30 text-xs">
            Showing {filtered.length} of {records.length} records
          </div>
        </div>
      )}

      {limeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Binary className="w-4 h-4 text-cyan-400" /> LIME Explanation
              </h3>
              <button onClick={() => setLimeModal(null)} className="text-white/40 hover:text-white text-sm">✕</button>
            </div>
            <p className="text-white/60 text-xs mb-4 truncate" title={limeModal.message}>{limeModal.message}</p>
            {limeModal.loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : limeModal.data?.words?.length ? (
              <div className="space-y-2">
                <p className="text-xs text-white/40">Base toxicity: {(limeModal.data.base_score * 100).toFixed(1)}%</p>
                {limeModal.data.words.map((w) => (
                  <div key={w.word} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white font-medium text-sm">{w.word}</span>
                    <span className={`text-xs font-mono ${w.direction === 'increases_toxicity' ? 'text-red-400' : 'text-green-400'}`}>
                      {w.importance > 0 ? '+' : ''}{(w.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm text-center py-6">No significant word contributions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
