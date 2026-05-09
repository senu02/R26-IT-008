import React, { useState } from 'react';
import { X, Ban, RefreshCw, ShieldCheck, Brain } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { 
  UserBehaviorProfile, 
  SuspendRequest, 
  BehaviorEvent,
  getPsychologicalPatternLabel 
} from '@/app/services/ToxicityBehaviors/actions';
import { WarningBadge, PsychologicalBadge, EventBadge } from './ToxicityBehaviorComponents';

export const SuspendModal = ({
  profile,
  onClose,
  onConfirm,
}: {
  profile: UserBehaviorProfile;
  onClose: () => void;
  onConfirm: (data: SuspendRequest) => Promise<void>;
}) => {
  const { colors } = useThemeColors();
  const [hours, setHours] = useState(24);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const handleConfirm = async () => {
    setSaving(true);
    setConfirmError('');
    try {
      await onConfirm({ hours, reason: reason || 'Manual suspension by admin.' });
      onClose();
    } catch (err: any) {
      setConfirmError(err?.message || 'Failed to suspend user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 rounded-2xl border shadow-2xl"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border.primary }}>
          <h2 className="font-semibold text-base" style={{ color: colors.text.primary }}>
            Suspend User
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: colors.text.tertiary }} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}
          >
            Suspending <strong style={{ color: colors.text.primary }}>
              {profile.user_email}
            </strong> — Pattern: <strong>{getPsychologicalPatternLabel(profile.psychological_pattern)}</strong>, 
            Risk: {(profile.psychological_risk_score * 100).toFixed(0)}%
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: colors.text.tertiary }}>
              Duration (hours)
            </label>
            <div className="flex gap-2">
              {[1, 6, 24, 48, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className="flex-1 py-1.5 text-xs rounded-lg border transition-all"
                  style={{
                    backgroundColor: hours === h ? colors.primary.main : 'transparent',
                    color: hours === h ? colors.primary.contrast : colors.text.secondary,
                    borderColor: hours === h ? colors.primary.main : colors.border.primary,
                  }}
                >
                  {h >= 168 ? '7d' : h >= 48 ? '2d' : h >= 24 ? '1d' : `${h}h`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: colors.text.tertiary }}>
              Reason (optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Manual suspension by admin."
              className="w-full text-sm p-3 rounded-lg border resize-none focus:outline-none"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
                color: colors.text.primary,
              }}
            />
          </div>

          {confirmError && (
            <div className="p-3 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-400">
              ⚠️ {confirmError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: colors.border.primary }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border"
            style={{ borderColor: colors.border.primary, color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            {saving && <RefreshCw size={13} className="animate-spin" />}
            <Ban size={13} />
            Suspend {hours >= 168 ? '7 days' : hours >= 24 ? `${hours / 24}d` : `${hours}h`}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfileDrawer = ({
  profile,
  events,
  onClose,
  onSuspend,
  onLift,
}: {
  profile: UserBehaviorProfile;
  events: BehaviorEvent[];
  onClose: () => void;
  onSuspend: () => void;
  onLift: () => Promise<void>;
}) => {
  const { colors } = useThemeColors();
  const [liftLoading, setLiftLoading] = useState(false);
  const userEvents = events.filter((e) => e.user === profile.user).slice(0, 8);

  const handleLift = async () => {
    setLiftLoading(true);
    try { await onLift(); onClose(); } finally { setLiftLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg h-full overflow-y-auto border-l shadow-2xl"
        style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: colors.text.primary }}>
              {profile.user_email.split('@')[0]}
            </h2>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>{profile.user_email}</p>
          </div>
          <button onClick={onClose}><X size={18} style={{ color: colors.text.tertiary }} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <WarningBadge level={profile.warning_level} />
            <PsychologicalBadge pattern={profile.psychological_pattern} riskScore={profile.psychological_risk_score} />
            {profile.is_currently_suspended && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-500/15 text-red-400 border-red-500/30">
                Suspended
              </span>
            )}
          </div>

          {profile.psychological_summary && (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.background.secondary, border: `0.5px solid ${colors.border.primary}` }}
            >
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: colors.text.secondary }}>
                <Brain size={12} /> Psychological Analysis
              </h3>
              <p className="text-sm mb-3" style={{ color: colors.text.primary }}>
                {profile.psychological_summary.summary}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: colors.text.tertiary }}>Impulsivity:</span> {(profile.impulsivity_score * 100).toFixed(0)}%</div>
                <div><span style={{ color: colors.text.tertiary }}>Malice:</span> {(profile.malice_score * 100).toFixed(0)}%</div>
                <div><span style={{ color: colors.text.tertiary }}>Escalation Risk:</span> {(profile.escalation_risk * 100).toFixed(0)}%</div>
                <div><span style={{ color: colors.text.tertiary }}>Recovery:</span> {(profile.recovery_score * 100).toFixed(0)}%</div>
              </div>
              {profile.psychological_recommendation && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border.primary }}>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    <strong>Recommendation:</strong> {profile.psychological_recommendation.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total violations', value: profile.toxic_count },
              { label: 'Times blocked', value: profile.blocked_count },
              { label: 'Warnings issued', value: profile.warning_count },
              { label: 'Avg severity', value: `${Math.round(profile.severity_score * 100)}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
              >
                <p className="text-xs mb-1" style={{ color: colors.text.tertiary }}>{label}</p>
                <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>{value}</p>
              </div>
            ))}
          </div>

          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: colors.text.secondary }}>Effective threshold</span>
              <span className="text-xs font-semibold" style={{ color: colors.primary.main }}>
                {profile.effective_threshold.toFixed(2)} (base: 0.50)
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${profile.effective_threshold * 100}%`, backgroundColor: colors.primary.main }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
              Lower threshold = more sensitive. Adjusted based on psychological pattern.
            </p>
          </div>

          {profile.is_currently_suspended && profile.suspended_until && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
              <p className="text-xs font-medium text-red-400 mb-1">Active suspension</p>
              <p className="text-xs text-red-300">
                Until: {new Date(profile.suspended_until).toLocaleString()}
              </p>
              {profile.suspension_reason && (
                <p className="text-xs text-red-300 mt-1">Reason: {profile.suspension_reason}</p>
              )}
            </div>
          )}

          <div className="space-y-2 text-xs" style={{ color: colors.text.tertiary }}>
            {profile.first_offence_at && (
              <p>First offence: {new Date(profile.first_offence_at).toLocaleDateString()}</p>
            )}
            {profile.last_offence_at && (
              <p>Last offence: {new Date(profile.last_offence_at).toLocaleDateString()}</p>
            )}
          </div>

          {userEvents.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>
                Recent events
              </h3>
              <div className="space-y-2">
                {userEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: colors.surface.primary, border: `0.5px solid ${colors.border.primary}` }}
                  >
                    <EventBadge type={e.event_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: colors.text.secondary }}>
                        {e.analysed_text}
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                        Score: {Math.round(e.toxicity_score * 100)}% · Psych Risk: {(e.psych_risk_at_event * 100).toFixed(0)}%
                      </p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: colors.text.tertiary }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {profile.is_currently_suspended ? (
              <button
                onClick={handleLift}
                disabled={liftLoading}
                className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                {liftLoading ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Lift suspension
              </button>
            ) : (
              <button
                onClick={onSuspend}
                className="flex-1 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <Ban size={13} />
                Suspend user (Psychological based)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};