'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Eye, EyeOff, Loader2, RefreshCw, AlertTriangle, BarChart3 } from 'lucide-react';
import { adaptiveShieldingAPI, type ShieldAdminRecord } from '@/lib/api';

const STRATEGY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Safe:      { label: 'Safe',      color: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <ShieldCheck  className="w-3.5 h-3.5" /> },
  Warning:   { label: 'Warning',   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
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

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adaptiveShieldingAPI.getAdminRecords();
      setRecords(data.records);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch records. Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // ── Derived stats ────────────────────────────────────────────────
  const stats = {
    total:     records.length,
    safe:      records.filter(r => r.strategy === 'Safe').length,
    warned:    records.filter(r => r.strategy === 'Warning').length,
    blurred:   records.filter(r => r.strategy === 'Blurring').length,
    rewritten: records.filter(r => r.strategy === 'Rewriting').length,
    filtered:  records.filter(r => r.strategy === 'Filtering').length,
  };

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
          { label: 'Warned',    value: stats.warned,    color: 'from-yellow-500/20 to-yellow-500/5',   text: 'text-yellow-400'  },
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
                {['#', 'User', 'Message', 'Strategy', 'Toxicity', 'Behavior', 'Final', 'Output', 'Date'].map(h => (
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
    </div>
  );
}
