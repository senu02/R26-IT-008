'use client';

import React from 'react';
import {
  Flame,
  ShieldAlert,
  MessageSquareX,
  AlertOctagon,
  Zap,
  Tag,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

interface ToxicityCategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryData: {
    labels: string[];
    data: number[];
  };
  totalFlaggedCount: number;
}

export function ToxicityCategoryFilter({
  selectedCategory,
  onSelectCategory,
  categoryData,
  totalFlaggedCount,
}: ToxicityCategoryFilterProps) {
  const { colors } = useThemeColors();

  // Helper to get count for a category label
  const getCount = (labelKey: string) => {
    const idx = categoryData.labels.findIndex(
      (l) => l.toLowerCase().includes(labelKey.toLowerCase()) || labelKey.toLowerCase().includes(l.toLowerCase())
    );
    if (idx !== -1) return categoryData.data[idx];
    return 0;
  };

  const categories: CategoryCount[] = [
    {
      id: 'all',
      name: 'All Flagged Content',
      count: totalFlaggedCount,
      icon: <Flame size={20} />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      description: 'All flagged posts & comments',
    },
    {
      id: 'hate',
      name: 'Hate Speech',
      count: getCount('Hate speech') || getCount('hate') || getCount('identity_hate'),
      icon: <AlertOctagon size={20} />,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'rgba(249, 115, 22, 0.3)',
      description: 'Discriminatory or slurs',
    },
    {
      id: 'harassment',
      name: 'Harassment & Toxic',
      count: getCount('Harassment') || getCount('toxic') || getCount('severe_toxic'),
      icon: <ShieldAlert size={20} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      description: 'Bullying & target attack',
    },
    {
      id: 'profanity',
      name: 'Profanity & Obscene',
      count: getCount('Profanity') || getCount('obscene'),
      icon: <MessageSquareX size={20} />,
      color: '#eab308',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      borderColor: 'rgba(234, 179, 8, 0.3)',
      description: 'Vulgar & explicit language',
    },
    {
      id: 'threats',
      name: 'Threats & Violence',
      count: getCount('Threats') || getCount('threat'),
      icon: <Zap size={20} />,
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      borderColor: 'rgba(236, 72, 153, 0.3)',
      description: 'Physical threats & harm',
    },
    {
      id: 'spam',
      name: 'Spam & Insults',
      count: getCount('Spam') || getCount('insult'),
      icon: <Tag size={20} />,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      description: 'Repetitive or abusive content',
    },
  ];

  return (
    <div
      className="p-5 rounded-2xl border shadow-xl space-y-4"
      style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Filter size={18} style={{ color: colors.primary.main }} />
          <div>
            <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
              Filter Content by Toxic Violation Category
            </h3>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Click any category card below to view specific flagged content violations.
            </p>
          </div>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all hover:opacity-75 self-start sm:self-auto"
            style={{ borderColor: colors.border.primary, color: colors.text.secondary }}
          >
            <CheckCircle2 size={13} className="text-emerald-500" /> Reset Category Filter
          </button>
        )}
      </div>

      {/* Grid of Interactive Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                isSelected ? 'ring-2 ring-offset-2 scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: isSelected ? cat.bgColor : colors.background.primary,
                borderColor: isSelected ? cat.color : colors.border.primary,
                ...(isSelected && { ringColor: cat.color }),
              }}
            >
              {/* Active glow indicator */}
              {isSelected && (
                <div
                  className="absolute top-0 right-0 w-12 h-12 rounded-bl-full pointer-events-none opacity-20"
                  style={{ backgroundColor: cat.color }}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <div
                  className="p-2.5 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cat.bgColor, color: cat.color }}
                >
                  {cat.icon}
                </div>

                <span
                  className="text-lg font-black font-mono"
                  style={{ color: isSelected ? cat.color : colors.text.primary }}
                >
                  {cat.count}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold truncate" style={{ color: colors.text.primary }}>
                  {cat.name}
                </h4>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: colors.text.tertiary }}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
