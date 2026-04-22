// app/admin/videos/components/StatsCards.tsx
'use client';

import React, { useState } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { Video as VideoIcon, AlertTriangle, Lock, Eye } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  const { colors, theme } = useThemeColors();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="rounded-xl p-6 transition-all duration-200 cursor-pointer backdrop-blur-sm"
      style={{
        background: theme === 'space' ? 'rgba(13, 20, 37, 0.8)' : colors.surface.primary,
        border: `1px solid ${colors.border.primary}`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: theme === 'space' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
            {value}
          </p>
        </div>
        <div
          className="rounded-full p-3"
          style={{ background: `${color}20`, color: color }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

interface StatsCardsProps {
  stats: {
    total: number;
    flagged: number;
    blocked: number;
    public: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { colors } = useThemeColors();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
      <StatCard
        title="Total Videos"
        value={stats.total}
        icon={VideoIcon}
        color={colors.primary.main}
      />
      <StatCard
        title="Flagged"
        value={stats.flagged}
        icon={AlertTriangle}
        color={colors.status.warning}
      />
      <StatCard
        title="Blocked"
        value={stats.blocked}
        icon={Lock}
        color={colors.status.error}
      />
      <StatCard
        title="Public Videos"
        value={stats.public}
        icon={Eye}
        color={colors.status.info}
      />
    </div>
  );
}