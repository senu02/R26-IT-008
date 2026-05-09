'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react'; // Added AlertTriangle here
import { ThemeProvider, useThemeColors } from '@/context/adminTheme';
import toxicityAPI, { ToxicityLog, UserToxicityProfile, ReviewLogRequest } from '@/app/services/ToxicityDetection//actions';
import { transformLogsToStats, transformLogsToTrendData, transformLogsToCategoryData, transformLogsToDailyData, transformProfilesToQuickMetrics } from '@/app/services/ToxicityDetection/actions';
import { ToxicityStatsCards } from '@/components/Admin/ToxicityDetector/ToxicityStatsCard';
import { ToxicityCharts } from '@/components/Admin/ToxicityDetector/ToxicityCharts';
import { ToxicityLogsTable } from '@/components/Admin/ToxicityDetector/ToxicityLogsTable';
import { ToxicityUsersTable } from '@/components/Admin/ToxicityDetector/ToxicityUsersTable';
import { SystemHealth } from '@/components/Admin/ToxicityDetector/SystemHealth';
import { DailyActivityChart } from '@/components/Admin/ToxicityDetector/DailyActivityChart';
import { ReviewModal } from '@/components/Admin/ToxicityDetector/ReviewModal';

// ... rest of the code remains the same

function ToxicityDetectionContent() {
  const { colors } = useThemeColors();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<ToxicityLog[]>([]);
  const [profiles, setProfiles] = useState<UserToxicityProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [reviewingLog, setReviewingLog] = useState<ToxicityLog | null>(null);

  const stats = useMemo(() => transformLogsToStats(logs), [logs]);
  const trendData = useMemo(() => transformLogsToTrendData(logs), [logs]);
  const categoryData = useMemo(() => transformLogsToCategoryData(logs), [logs]);
  const dailyData = useMemo(() => transformLogsToDailyData(logs), [logs]);
  const quickMetrics = useMemo(() => transformProfilesToQuickMetrics(profiles), [profiles]);
  const recentToxicCount = useMemo(() => logs.filter((l) => l.is_toxic && !l.is_reviewed).length, [logs]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const [logsRes, profilesRes] = await Promise.all([
        toxicityAPI.getLogs({ page_size: 200 }),
        toxicityAPI.getUserProfiles({ page_size: 200 }),
      ]);

      setLogs(logsRes.results);
      setProfiles(profilesRes.results);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const handleReviewSave = useCallback(async (data: ReviewLogRequest) => {
    if (!reviewingLog) return;
    const res = await toxicityAPI.reviewLog(reviewingLog.id, data);
    setLogs((prev) => prev.map((l) => (l.id === res.log.id ? res.log : l)));
  }, [reviewingLog]);

  const handleToggleFlag = useCallback(async (userId: string) => {
    try {
      const res = await toxicityAPI.toggleUserFlag(userId);
      setProfiles((prev) => prev.map((p) => (p.user === userId ? { ...p, is_flagged: res.is_flagged } : p)));
    } catch (err: any) {
      alert(err.message ?? 'Failed to toggle flag');
    }
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto" style={{ borderColor: colors.primary.main, borderTopColor: 'transparent' }} />
          <p className="mt-4 text-sm" style={{ color: colors.text.secondary }}>Loading toxicity data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center max-w-md p-6 rounded-xl border border-red-500/20" style={{ backgroundColor: colors.surface.primary }}>
          <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Failed to load</h2>
          <p className="text-sm mb-5" style={{ color: colors.text.secondary }}>{error}</p>
          <button onClick={() => fetchData()} className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center gap-2 mx-auto" style={{ backgroundColor: colors.primary.main, color: 'white' }}>
            <RefreshCw size={14} />Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10" style={{ backgroundColor: colors.background.primary }}>
      {reviewingLog && <ReviewModal log={reviewingLog} onClose={() => setReviewingLog(null)} onSave={handleReviewSave} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Toxicity Detection</h1>
          <p className="mt-0.5 text-sm" style={{ color: colors.text.secondary }}>Monitor and moderate toxic content across your platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing} className="px-3 py-2 rounded-lg text-sm border flex items-center gap-2 transition-all hover:opacity-70" style={{ borderColor: colors.border.primary, color: colors.text.secondary }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh
          </button>
          <button className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all hover:opacity-90" style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}>
            <Shield size={14} />Run scan
          </button>
        </div>
      </div>

      <ToxicityStatsCards stats={stats} quickMetrics={quickMetrics} recentToxicCount={recentToxicCount} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ToxicityCharts trendData={trendData} categoryData={categoryData} dailyData={dailyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DailyActivityChart dailyData={dailyData} />
        <SystemHealth quickMetrics={quickMetrics} activeFlags={stats.activeFlags} />
      </div>

      <div>
        <div className="flex border-b mb-4" style={{ borderColor: colors.border.primary }}>
          {(['logs', 'users'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors" style={{ borderBottomColor: activeTab === tab ? colors.primary.main : 'transparent', color: activeTab === tab ? colors.primary.main : colors.text.secondary }}>
              {tab === 'logs' ? `Flagged content (${logs.filter(l => l.is_toxic).length})` : `User profiles (${profiles.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'logs' && <ToxicityLogsTable logs={logs} onReviewLog={setReviewingLog} />}
        {activeTab === 'users' && <ToxicityUsersTable profiles={profiles} onToggleFlag={handleToggleFlag} />}
      </div>
    </div>
  );
}

export default function ToxicityDetectionPage() {
  return (
    <ThemeProvider>
      <ToxicityDetectionContent />
    </ThemeProvider>
  );
}