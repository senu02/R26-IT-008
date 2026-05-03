'use client';

import { PieChart as PieChartIcon } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useThemeColors } from '@/context/adminTheme';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ToxicityChartsProps {
  trendData: {
    labels: string[];
    toxicData: number[];
    nonToxicData: number[];
  };
  categoryData: {
    labels: string[];
    data: number[];
  };
  dailyData: {
    labels: string[];
    detectedData: number[];
    resolvedData: number[];
  };
}

const CHART_PIE_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#ec4899', '#06b6d4'];

export function ToxicityCharts({ trendData, categoryData, dailyData }: ToxicityChartsProps) {
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
  };

  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Toxic',
        data: trendData.toxicData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#ef4444',
      },
      {
        label: 'Non-toxic',
        data: trendData.nonToxicData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const doughnutData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: CHART_PIE_COLORS,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
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
    <>
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Detection trend
          </h3>
          <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.tertiary }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Toxic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Non-toxic
            </span>
          </div>
        </div>
        <p className="text-xs mb-4" style={{ color: colors.text.tertiary }}>
          Monthly content volume
        </p>
        <div style={{ height: 240 }}>
          {trendData.labels.length > 0 ? (
            <Line
              data={lineChartData}
              options={{
                ...sharedChartOptions,
                scales: {
                  y: {
                    type: 'linear' as const,
                    grid: { color: `${colors.border.primary}60` },
                    ticks: { color: colors.text.tertiary, font: { size: 11 } },
                  },
                  x: {
                    type: 'category' as const,
                    grid: { display: false },
                    ticks: { color: colors.text.tertiary, font: { size: 11 } },
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: colors.text.tertiary }}>
                No trend data yet
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Violation categories
          </h3>
          <PieChartIcon size={16} style={{ color: colors.text.tertiary }} />
        </div>
        <p className="text-xs mb-4" style={{ color: colors.text.tertiary }}>
          Distribution by type
        </p>
        <div style={{ height: 200 }}>
          {categoryData.data.some((v) => v > 0) ? (
            <Doughnut
              data={doughnutData}
              options={{
                ...sharedChartOptions,
                cutout: '65%',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: colors.text.tertiary }}>
                No category data yet
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
          {categoryData.labels.map((label, i) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: colors.text.secondary }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_PIE_COLORS[i] }}
              />
              {label}
              <span style={{ color: colors.text.tertiary }}>({categoryData.data[i]})</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}