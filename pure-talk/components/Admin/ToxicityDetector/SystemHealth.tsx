'use client';

import { Zap, UserX, AlertTriangle, Clock } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';

interface SystemHealthProps {
  quickMetrics: {
    suspendedUsers: number;
    highRiskUsers: number;
  };
  activeFlags: number;
}

export function SystemHealth({ quickMetrics, activeFlags }: SystemHealthProps) {
  const { colors } = useThemeColors();

  const healthItems = [
    { icon: Zap, label: 'Avg response time', value: '0.42s', color: colors.primary.main },
    { icon: UserX, label: 'Suspended users', value: quickMetrics.suspendedUsers, color: colors.status.error },
    { icon: AlertTriangle, label: 'High-risk users', value: quickMetrics.highRiskUsers, color: colors.status.warning },
    { icon: Clock, label: 'Pending review', value: activeFlags, color: colors.status.warning },
  ];

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
      <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>System health</h3>

      {healthItems.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
              <Icon size={14} />
            </div>
            <span className="text-xs" style={{ color: colors.text.secondary }}>{label}</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{value}</span>
        </div>
      ))}

      <div className="pt-3 border-t" style={{ borderColor: colors.border.primary }}>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs" style={{ color: colors.text.secondary }}>AI model accuracy</span>
          <span className="text-xs font-semibold" style={{ color: colors.primary.main }}>96.8%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface.tertiary }}>
          <div className="h-full rounded-full" style={{ width: '96.8%', backgroundColor: colors.primary.main }} />
        </div>
      </div>
    </div>
  );
}