"use client";
import React, { useEffect, useState } from "react";
import { Shield, ShieldAlert, Loader2, AlertTriangle, UserX, EyeOff, ShieldCheck } from "lucide-react";
import { adaptiveShieldingAPI, type ToxicityRecord } from "@/lib/api";

export default function AdaptiveShieldingDashboard() {
  const [records, setRecords] = useState<ToxicityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await adaptiveShieldingAPI.getAdminRecords();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || "Failed to load adaptive shielding records.");
    } finally {
      setLoading(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case "Filtering":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "Blurring":
        return <EyeOff className="h-4 w-4 text-orange-500" />;
      case "Warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Rewriting":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "Filtering": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "Blurring": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "Warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Rewriting": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-green-500/10 text-green-600 border-green-500/20";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-[#fd297b]" />
          Adaptive Shielding Logs
        </h1>
        <p className="text-[var(--ig-muted)]">
          Monitor user behavior and AI content moderation actions.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ig-muted)]" />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--ig-border)] bg-[var(--background)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/5 dark:bg-white/5 text-[var(--ig-muted)] border-b border-[var(--ig-border)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">User / Time</th>
                  <th className="px-6 py-4 font-semibold">Original Message</th>
                  <th className="px-6 py-4 font-semibold">Action Taken</th>
                  <th className="px-6 py-4 font-semibold">Final Output</th>
                  <th className="px-6 py-4 font-semibold text-right">Scores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ig-border)]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--ig-muted)]">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{record.user}</div>
                        <div className="text-xs text-[var(--ig-muted)] mt-1">
                          {new Date(record.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="truncate" title={record.message}>{record.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStrategyColor(record.strategy)}`}>
                          {getStrategyIcon(record.strategy)}
                          {record.strategy}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        {record.strategy === "Filtering" ? (
                          <span className="text-red-500 text-xs italic">Blocked</span>
                        ) : (
                          <p className="truncate" title={record.processed_output}>{record.processed_output}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1 text-xs">
                          <span title="Final AI Score" className="font-semibold px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                            {record.final_score.toFixed(2)}
                          </span>
                          <span className="text-[var(--ig-muted)]" title="Toxicity | Behavior">
                            T: {record.toxicity_score.toFixed(2)} | B: {record.behavior_score?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
