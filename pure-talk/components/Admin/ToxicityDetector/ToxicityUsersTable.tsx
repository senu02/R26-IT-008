'use client';

import { useState } from 'react';
import { Users, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { UserToxicityProfile } from '@/app/services/ToxicityDetection/actions';

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

interface ToxicityUsersTableProps {
  profiles: UserToxicityProfile[];
  onToggleFlag: (userId: string) => Promise<void>;
}

export function ToxicityUsersTable({ profiles, onToggleFlag }: ToxicityUsersTableProps) {
  const { colors } = useThemeColors();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const paginatedProfiles = profiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
        <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>User toxicity profiles</h3>
        <span className="text-xs" style={{ color: colors.text.tertiary }}>{profiles.length} total</span>
      </div>

      <div className="overflow-x-auto">
        {paginatedProfiles.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: colors.text.secondary }} />
            <p className="text-sm" style={{ color: colors.text.secondary }}>No user profiles found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: colors.background.secondary }}>
              <tr>
                {['User', 'Toxicity rate', 'Total checks', 'Toxic posts', 'Toxic comments', 'Peak score', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: colors.text.tertiary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProfiles.map((profile) => {
                const rate = Math.round(profile.toxicity_rate * 100);
                const rateColor = profile.toxicity_rate > 0.5 ? '#ef4444' : profile.toxicity_rate > 0.2 ? '#f97316' : '#22c55e';
                const initial = (profile.user_email?.[0] ?? 'U').toUpperCase();
                return (
                  <tr key={profile.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: colors.border.light }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${colors.primary.main}25`, color: colors.primary.main }}>
                          {initial}
                        </div>
                        <div>
                          <p style={{ color: colors.text.primary }}>{profile.user_email?.split('@')[0] ?? '—'}</p>
                          <p className="text-xs" style={{ color: colors.text.tertiary }}>{profile.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-28">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface.tertiary }}>
                          <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: rateColor }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right" style={{ color: rateColor }}>{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: colors.text.primary }}>{profile.total_posts_checked + profile.total_comments_checked}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: colors.text.primary }}>{profile.toxic_post_count}</span>
                      <span className="text-xs ml-1" style={{ color: colors.text.tertiary }}>/ {profile.total_posts_checked}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: colors.text.primary }}>{profile.toxic_comment_count}</span>
                      <span className="text-xs ml-1" style={{ color: colors.text.tertiary }}>/ {profile.total_comments_checked}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={profile.highest_toxicity_score} />
                    </td>
                    <td className="px-4 py-3">
                      {profile.is_suspended ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-500/15 text-red-400 border-red-500/30">Suspended</span>
                      ) : profile.is_flagged ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-500/15 text-orange-400 border-orange-500/30">Flagged</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-green-500/15 text-green-400 border-green-500/30">Clean</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onToggleFlag(profile.user)} className="p-1.5 rounded-lg transition-all hover:opacity-70" title={profile.is_flagged ? 'Remove flag' : 'Flag user'}>
                        {profile.is_flagged ? <UserCheck size={14} style={{ color: '#22c55e' }} /> : <UserX size={14} style={{ color: '#ef4444' }} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={profiles.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}