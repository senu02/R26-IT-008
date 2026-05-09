import React from 'react';
import { Brain, Network } from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { UserBehaviorProfile, SNASummary, transformProfilesToPsychologicalData } from '@/app/services/ToxicityBehaviors/actions';

export const PsychologicalStatsCard = ({ profiles }: { profiles: UserBehaviorProfile[] }) => {
  const { colors } = useThemeColors();
  const highRisk = profiles.filter(p => p.psychological_risk_score > 0.6).length;
  const mediumRisk = profiles.filter(p => p.psychological_risk_score > 0.3 && p.psychological_risk_score <= 0.6).length;
  const lowRisk = profiles.filter(p => p.psychological_risk_score <= 0.3).length;
  const escalating = profiles.filter(p => p.psychological_pattern === 'escalating').length;
  const malicious = profiles.filter(p => p.psychological_pattern === 'malicious').length;
  const recovering = profiles.filter(p => p.psychological_pattern === 'recovering').length;
  const impulsive = profiles.filter(p => p.psychological_pattern === 'impulsive').length;
  
  const patternData = transformProfilesToPsychologicalData(profiles);
  
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Brain size={16} style={{ color: colors.primary.main }} />
            Psychological Risk Analysis
          </h3>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            AI-powered behavior pattern detection
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <div className="text-lg font-bold text-red-500">{highRisk}</div>
          <div className="text-xs" style={{ color: colors.text.tertiary }}>High Risk</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <div className="text-lg font-bold text-orange-500">{mediumRisk}</div>
          <div className="text-xs" style={{ color: colors.text.tertiary }}>Medium Risk</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
          <div className="text-lg font-bold text-green-500">{lowRisk}</div>
          <div className="text-xs" style={{ color: colors.text.tertiary }}>Low Risk</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 text-xs mb-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/> Escalating: {escalating}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-700"/> Malicious: {malicious}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/> Recovering: {recovering}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"/> Impulsive: {impulsive}</span>
      </div>
      
      <div className="pt-3 border-t" style={{ borderColor: colors.border.primary }}>
        <div className="flex justify-between text-xs mb-2" style={{ color: colors.text.tertiary }}>
          <span>Pattern Distribution</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          {patternData.data.map((count, i) => {
            if (count === 0) return null;
            const percentage = (count / profiles.length) * 100;
            return (
              <div
                key={i}
                style={{ width: `${percentage}%`, backgroundColor: patternData.colors[i] }}
                className="h-full"
                title={`${patternData.labels[i]}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {patternData.labels.map((label, i) => (
            patternData.data[i] > 0 && (
              <span key={label} className="text-xs" style={{ color: colors.text.tertiary }}>
                {label}: {patternData.data[i]}
              </span>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export const SNACard = ({ summary }: { summary: SNASummary | null }) => {
  const { colors } = useThemeColors();
  if (!summary) return null;

  const toxicPct = summary.total_nodes > 0
    ? Math.round((summary.toxic_nodes / summary.total_nodes) * 100)
    : 0;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Social Network Analysis
          </h3>
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Interaction graph with psychological metrics
          </p>
        </div>
        <Network size={16} style={{ color: colors.text.tertiary }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total nodes', value: summary.total_nodes },
          { label: 'Toxic nodes', value: summary.toxic_nodes, color: '#ef4444' },
          { label: 'At-risk nodes', value: summary.at_risk_nodes, color: '#f97316' },
          { label: 'Total edges', value: summary.total_edges },
          { label: 'Toxic edges', value: summary.toxic_edges, color: '#ef4444' },
          { label: 'Avg clustering', value: summary.avg_clustering.toFixed(2) },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-2.5 rounded-lg text-center"
            style={{ backgroundColor: colors.background.secondary }}
          >
            <p
              className="text-lg font-bold"
              style={{ color: (color as string) || colors.text.primary }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>{label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Toxic node ratio</span>
          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{toxicPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${toxicPct}%`, backgroundColor: '#ef4444' }} />
        </div>
      </div>

      {summary.contagion_candidates?.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border.primary }}>
          <p className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>
            Contagion risk users ({summary.contagion_candidates.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.contagion_candidates.slice(0, 5).map((c: any, i: number) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#ef444418', color: '#ef4444' }}
              >
                {c.username ?? c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};