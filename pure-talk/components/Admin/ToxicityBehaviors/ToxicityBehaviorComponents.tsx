import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Flame,
  Zap,
  GraduationCap,
  Ban,
  ShieldCheck,
  Eye,
  Users,
  CalendarClock,
  AlertTriangle,
  Activity,
  Filter,
  Network,
  ListFilter,
} from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import {
  WarningLevel,
  EventType,
  PsychologicalPattern,
  getWarningLevelLabel,
  getWarningLevelColor,
  getEventTypeColor,
  getPsychologicalPatternLabel,
  getPsychologicalPatternColor,
  getRiskLevelColor,
} from '@/app/services/ToxicityBehaviors/actions';

export const WarningBadge = ({ level }: { level: WarningLevel }) => {
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

export const PsychologicalBadge = ({ pattern, riskScore }: { pattern: string; riskScore: number }) => {
  const color = getPsychologicalPatternColor(pattern as PsychologicalPattern);
  const label = getPsychologicalPatternLabel(pattern as PsychologicalPattern);
  const riskLevel = riskScore > 0.6 ? 'HIGH' : riskScore > 0.3 ? 'MEDIUM' : 'LOW';
  const riskColor = getRiskLevelColor(riskLevel);
  
  const getIcon = () => {
    switch (pattern) {
      case 'escalating': return <TrendUp size={10} />;
      case 'malicious': return <Flame size={10} />;
      case 'recovering': return <TrendDown size={10} />;
      case 'impulsive': return <Zap size={10} />;
      case 'chronic_low': return <GraduationCap size={10} />;
      default: return null;
    }
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${color}20`, color, border: `0.5px solid ${color}40` }}
      >
        {getIcon()}
        {label}
      </span>
      <span
        className="px-1.5 py-0.5 rounded-full text-xs font-mono"
        style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
      >
        {(riskScore * 100).toFixed(0)}%
      </span>
    </div>
  );
};

export const EventBadge = ({ type }: { type: EventType }) => {
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

export const ScoreBar = ({ score, max = 1 }: { score: number; max?: number }) => {
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

export const StatCard = ({
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