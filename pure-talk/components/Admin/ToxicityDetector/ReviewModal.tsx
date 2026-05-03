'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { ToxicityLog, ReviewLogRequest } from '@/app/services/ToxicityDetection/actions';

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

interface ReviewModalProps {
  log: ToxicityLog;
  onClose: () => void;
  onSave: (data: ReviewLogRequest) => Promise<void>;
}

export function ReviewModal({ log, onClose, onSave }: ReviewModalProps) {
  const { colors } = useThemeColors();
  const [overridden, setOverridden] = useState(log.overridden);
  const [notes, setNotes] = useState(log.review_notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ overridden, review_notes: notes });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border shadow-2xl" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border.primary }}>
          <h2 className="font-semibold text-base" style={{ color: colors.text.primary }}>Review Log #{log.id}</h2>
          <button onClick={onClose}><X size={18} style={{ color: colors.text.tertiary }} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.tertiary }}>Analysed content</p>
            <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>{log.analysed_text}</p>
          </div>

          <div>
            <p className="text-xs mb-2" style={{ color: colors.text.tertiary }}>Label scores</p>
            <div className="space-y-2">
              {Object.entries(log.label_scores).map(([label, score]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs w-24 capitalize" style={{ color: colors.text.secondary }}>{label.replace(/_/g, ' ')}</span>
                  <div className="flex-1"><ScoreBar score={score as number} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={overridden} onChange={(e) => setOverridden(e.target.checked)} />
              <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
            </label>
            <span className="text-sm" style={{ color: colors.text.secondary }}>Override AI decision (mark as non-toxic)</span>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.tertiary }}>Review notes</p>
            <textarea
              className="w-full text-sm p-3 rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes..."
              style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: colors.border.primary }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border transition-all hover:opacity-80" style={{ borderColor: colors.border.primary, color: colors.text.primary }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}>
            {saving && <RefreshCw size={14} className="animate-spin" />}Save review
          </button>
        </div>
      </div>
    </div>
  );
}