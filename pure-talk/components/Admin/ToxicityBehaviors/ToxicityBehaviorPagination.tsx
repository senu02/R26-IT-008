import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';

export const Pagination = ({
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