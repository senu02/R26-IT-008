'use client';

import { AlertTriangle, CheckCircle, Flag, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: StatCardProps) => {
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
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp size={13} style={{ color: colors.status.error }} />
          ) : (
            <TrendingDown size={13} style={{ color: colors.status.success }} />
          )}
          <span
            className="text-xs font-semibold"
            style={{ color: trend === 'up' ? colors.status.error : colors.status.success }}
          >
            {trendValue}
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
        {title}
      </div>
    </div>
  );
};

interface ToxicityStatsCardsProps {
  stats: {
    totalDetections: number;
    resolvedCases: number;
    activeFlags: number;
  };
  quickMetrics: {
    flaggedUsers: number;
    suspendedUsers: number;
  };
  recentToxicCount: number;
}

export function ToxicityStatsCards({ stats, quickMetrics, recentToxicCount }: ToxicityStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total detections"
        value={stats.totalDetections}
        icon={AlertTriangle}
        trend="up"
        trendValue={`${recentToxicCount} unreviewed`}
        color="#ef4444"
      />
      <StatCard
        title="Resolved cases"
        value={stats.resolvedCases}
        icon={CheckCircle}
        trend="down"
        trendValue={`${Math.round((stats.resolvedCases / Math.max(stats.totalDetections, 1)) * 100)}% rate`}
        color="#10b981"
      />
      <StatCard
        title="Active flags"
        value={stats.activeFlags}
        icon={Flag}
        trend="up"
        trendValue="pending review"
        color="#f59e0b"
      />
      <StatCard
        title="Flagged users"
        value={quickMetrics.flaggedUsers}
        icon={Activity}
        trend="up"
        trendValue={`${quickMetrics.suspendedUsers} suspended`}
        color="#8b5cf6"
      />
    </div>
  );
}