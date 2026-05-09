'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useThemeColors } from '@/context/adminTheme';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyActivityChartProps {
  dailyData: {
    labels: string[];
    detectedData: number[];
    resolvedData: number[];
  };
}

export function DailyActivityChart({ dailyData }: DailyActivityChartProps) {
  const { colors } = useThemeColors();

  const sharedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.surface.primary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.primary,
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: { color: `${colors.border.primary}60` },
        ticks: { color: colors.text.tertiary, font: { size: 11 } },
      },
      x: {
        type: 'category' as const,
        grid: { display: false },
        ticks: { color: colors.text.tertiary, font: { size: 11 } },
      },
    },
  };

  const barChartData = {
    labels: dailyData.labels,
    datasets: [
      {
        label: 'Detected',
        data: dailyData.detectedData,
        backgroundColor: 'rgba(239,68,68,0.8)',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Resolved',
        data: dailyData.resolvedData,
        backgroundColor: 'rgba(16,185,129,0.8)',
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  return (
    <div className="lg:col-span-2 rounded-xl border p-5" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>Daily activity</h3>
        <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.tertiary }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" /> Detected</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Resolved</span>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: colors.text.tertiary }}>Detected vs resolved by day of week</p>
      <div style={{ height: 240 }}>
        <Bar data={barChartData} options={sharedChartOptions} />
      </div>
    </div>
  );
}