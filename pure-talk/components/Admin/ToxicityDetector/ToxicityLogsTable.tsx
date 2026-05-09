'use client';

import { useState } from 'react';
import { Flag, Search, X, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { ToxicityLog, getSeverity, getLogStatus, getCategoryLabel } from '@/app/services/ToxicityDetection/actions';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    Medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    Low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  };
  const c = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS['Low'];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Reviewing: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    Pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  };
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['Pending'];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
};

const ScoreBar = ({ score }: { score: number }) => {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? '#ef4444' : score >= 0.6 ? '#f97316' : score >= 0.4 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
};

const Pagination = ({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) => {
  const { colors } = useThemeColors();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs" style={{ color: colors.text.tertiary }}>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg disabled:opacity-30 transition-all hover:opacity-70">
          <ChevronLeft size={15} style={{ color: colors.text.primary }} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="w-7 h-7 text-xs rounded-lg font-medium transition-all"
              style={{
                backgroundColor: p === page ? colors.primary.main : 'transparent',
                color: p === page ? colors.primary.contrast : colors.text.secondary,
              }}
            >
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg disabled:opacity-30 transition-all hover:opacity-70">
          <ChevronRight size={15} style={{ color: colors.text.primary }} />
        </button>
      </div>
    </div>
  );
};

interface ToxicityLogsTableProps {
  logs: ToxicityLog[];
  onReviewLog: (log: ToxicityLog) => void;
}

export function ToxicityLogsTable({ logs, onReviewLog }: ToxicityLogsTableProps) {
  const { colors } = useThemeColors();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredLogs = logs.filter((log) => {
    if (!log.is_toxic) return false;
    if (severityFilter !== 'all' && getSeverity(log.max_score) !== severityFilter) return false;
    if (statusFilter !== 'all' && getLogStatus(log) !== statusFilter) return false;
    if (contentTypeFilter !== 'all' && log.content_type !== contentTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!log.analysed_text.toLowerCase().includes(q) && !log.author_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} />
          <input
            type="text"
            placeholder="Search by content or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1"
            style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary, color: colors.text.primary }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X size={12} style={{ color: colors.text.tertiary }} />
            </button>
          )}
        </div>

        <Filter size={13} style={{ color: colors.text.tertiary }} />

        <div className="flex gap-1">
          {['all', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: severityFilter === s ? colors.primary.main : 'transparent',
                color: severityFilter === s ? colors.primary.contrast : colors.text.secondary,
                borderColor: severityFilter === s ? colors.primary.main : colors.border.primary,
              }}
            >
              {s === 'all' ? 'All severity' : s}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {['all', 'Pending', 'Reviewing', 'Resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: statusFilter === s ? colors.primary.main : 'transparent',
                color: statusFilter === s ? colors.primary.contrast : colors.text.secondary,
                borderColor: statusFilter === s ? colors.primary.main : colors.border.primary,
              }}
            >
              {s === 'all' ? 'All status' : s}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {['all', 'post', 'comment'].map((s) => (
            <button
              key={s}
              onClick={() => setContentTypeFilter(s)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: contentTypeFilter === s ? colors.primary.main : 'transparent',
                color: contentTypeFilter === s ? colors.primary.contrast : colors.text.secondary,
                borderColor: contentTypeFilter === s ? colors.primary.main : colors.border.primary,
              }}
            >
              {s === 'all' ? 'All types' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
          <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>Flagged content</h3>
          <span className="text-xs" style={{ color: colors.text.tertiary }}>{filteredLogs.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Flag size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
              <p className="text-sm" style={{ color: colors.text.secondary }}>No entries match the current filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: colors.background.secondary }}>
                <tr>
                  {['User', 'Content', 'Type', 'Score', 'Severity', 'Status', 'Time', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: colors.text.tertiary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const severity = getSeverity(log.max_score);
                  const logStatus = getLogStatus(log);
                  const initial = (log.author_email?.[0] ?? 'U').toUpperCase();
                  return (
                    <tr key={log.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: colors.border.light }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${colors.primary.main}25`, color: colors.primary.main }}>
                            {initial}
                          </div>
                          <span style={{ color: colors.text.primary }}>{log.author_email?.split('@')[0] ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-xs" title={log.analysed_text} style={{ color: colors.text.secondary }}>{log.analysed_text}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span style={{ color: colors.text.primary }}>{getCategoryLabel(log.flagged_labels)}</span>
                        <span className="text-xs ml-1" style={{ color: colors.text.tertiary }}>({log.content_type})</span>
                      </td>
                      <td className="px-4 py-3 min-w-28"><ScoreBar score={log.max_score} /></td>
                      <td className="px-4 py-3"><SeverityBadge severity={severity} /></td>
                      <td className="px-4 py-3"><StatusBadge status={logStatus} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs" style={{ color: colors.text.tertiary }}>
                          {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => onReviewLog(log)} className="p-1.5 rounded-lg transition-all hover:opacity-70" title="Review log">
                          <Eye size={14} style={{ color: colors.text.tertiary }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Pagination page={page} total={filteredLogs.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}