// app/admin/dashboard/page.tsx (Updated with Space Theme)
'use client';

import { useState, useEffect } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import {
  Users, Folder, DollarSign, Target, MoreHorizontal,
  Star, Calendar, MessageSquare, FileText, Code, Camera,
  Circle, CheckCircle, Rocket, Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const recentActivities = [
  { id: 1, user: 'Sarah Chen', action: 'completed', target: 'Dashboard redesign', time: '2 hours ago', avatar: 'SC', color: 'from-indigo-400 to-purple-500' },
  { id: 2, user: 'Michael Park', action: 'commented on', target: 'API integration', time: '4 hours ago', avatar: 'MP', color: 'from-emerald-400 to-teal-500' },
  { id: 3, user: 'Emma Watson', action: 'created', target: 'New project proposal', time: 'yesterday', avatar: 'EW', color: 'from-rose-400 to-pink-500' },
  { id: 4, user: 'James Wilson', action: 'assigned', target: 'Security audit task', time: 'yesterday', avatar: 'JW', color: 'from-amber-400 to-orange-500' },
  { id: 5, user: 'Lisa Brown', action: 'reviewed', target: 'Pull request #42', time: '2 days ago', avatar: 'LB', color: 'from-cyan-400 to-blue-500' },
];

const quickLinks = [
  { icon: <FileText size={20} />, label: 'Documents' },
  { icon: <Calendar size={20} />, label: 'Calendar' },
  { icon: <MessageSquare size={20} />, label: 'Messages' },
  { icon: <Users size={20} />, label: 'Team' },
  { icon: <Star size={20} />, label: 'Favorites' },
];

const recentFiles = [
  { id: 1, name: 'Q1 Report.pdf', size: '2.4 MB', date: 'Today', icon: <FileText size={16} /> },
  { id: 2, name: 'Design System.fig', size: '5.1 MB', date: 'Yesterday', icon: <Camera size={16} /> },
  { id: 3, name: 'API Documentation', size: '1.2 MB', date: 'Yesterday', icon: <Code size={16} /> },
];

const upcomingEvents = [
  { id: 1, title: 'Team Standup', time: '10:00 AM', date: 'Today', type: 'meeting' },
  { id: 2, title: 'Design Review', time: '2:00 PM', date: 'Today', type: 'review' },
  { id: 3, title: 'Client Call', time: '11:00 AM', date: 'Tomorrow', type: 'call' },
];

export default function AdminDashboard() {
  const { colors, theme } = useThemeColors();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { title: 'Total Revenue', value: '$54,239', change: 12.5, icon: <DollarSign size={18} />, color: colors.primary.main },
    { title: 'Total Users', value: '2,847', change: 8.2, icon: <Users size={18} />, color: colors.secondary.main },
    { title: 'Active Projects', value: '24', change: -2.1, icon: <Folder size={18} />, color: colors.accent.amber },
    { title: 'Completion Rate', value: '94%', change: 5.3, icon: <Target size={18} />, color: colors.accent.rose },
  ];

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: [32000, 35400, 38900, 42300, 46800, 51200, 54239],
        borderColor: colors.primary.main,
        backgroundColor: `${colors.primary.main}20`,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Profit',
        data: [12000, 13500, 14800, 16200, 17900, 19500, 20800],
        borderColor: colors.secondary.main,
        backgroundColor: `${colors.secondary.main}15`,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Total Users',
      data: [1240, 1560, 1890, 2210, 2530, 2710, 2847],
      backgroundColor: colors.primary.main,
      borderRadius: 8,
    }]
  };

  const platformData = {
    labels: ['Web', 'Mobile', 'Desktop', 'Tablet'],
    datasets: [{
      data: [45, 30, 15, 10],
      backgroundColor: [colors.primary.main, colors.secondary.main, colors.accent.amber, colors.accent.rose],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: colors.text.secondary, usePointStyle: true } },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: colors.surface.primary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.primary,
        borderWidth: 1,
      }
    },
    scales: {
      x: { 
        ticks: { color: colors.text.secondary }, 
        grid: { color: colors.border.primary },
        title: { color: colors.text.tertiary }
      },
      y: { 
        ticks: { color: colors.text.secondary }, 
        grid: { color: colors.border.primary },
        title: { color: colors.text.tertiary }
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: theme === 'space' ? 4 : 3,
        hoverRadius: theme === 'space' ? 6 : 5,
        borderWidth: theme === 'space' ? 2 : 1,
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: colors.text.secondary, font: { size: 11 } } },
      tooltip: {
        backgroundColor: colors.surface.primary,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        borderColor: colors.border.primary,
        borderWidth: 1,
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 relative" style={{ 
      backgroundColor: colors.background.primary,
      minHeight: '100vh',
      ...(theme === 'space' && {
        backgroundImage: `radial-gradient(circle at 10% 20%, ${colors.primary.main}10 2px, transparent 2px), radial-gradient(circle at 90% 80%, ${colors.secondary.main}10 1px, transparent 1px)`,
        backgroundSize: '60px 60px, 40px 40px'
      })
    }}>
      {/* Space theme decorative stars */}
      {theme === 'space' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2})`,
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 4 + 2 + 's',
              }}
            />
          ))}
          {/* Shooting star */}
          <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-shooting-star" />
        </div>
      )}

      <div className="relative z-10">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Admin Dashboard</h1>
          <p className="mt-1" style={{ color: colors.text.secondary }}>Welcome back, Admin. Here's what's happening today.</p>
        </div>

        {/* Banner */}
        <div className="rounded-2xl p-6 text-white relative overflow-hidden mt-4" style={{ background: colors.gradient.banner }}>
          {theme === 'space' && (
            <>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute top-1/2 right-20 w-2 h-2 bg-white rounded-full animate-pulse" />
              <div className="absolute bottom-4 right-32 w-1 h-1 bg-yellow-300 rounded-full" />
            </>
          )}
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, Admin! 👋</h2>
              <p className="mt-1 opacity-90">Here's what's happening with your workspace today.</p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-1 text-sm backdrop-blur-sm flex items-center gap-2">
              {theme === 'space' && <Rocket size={14} className="animate-pulse" />}
              <span>Last updated: Today</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className="rounded-xl border p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: stat.change > 0 ? `${colors.status.success}20` : `${colors.status.error}20`, color: stat.change > 0 ? colors.status.success : colors.status.error }}>
                  {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>Revenue Overview</h3>
            <div className="h-80"><Line data={revenueData} options={chartOptions} /></div>
          </div>
          <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>User Growth</h3>
            <div className="h-80"><Bar data={userGrowthData} options={chartOptions} /></div>
          </div>
        </div>

        {/* Activity and Distribution */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>Recent Activity</h3>
              <button className="text-sm hover:underline transition-all" style={{ color: colors.primary.main }}>View All</button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]" style={{ backgroundColor: colors.background.secondary }}>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {item.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: colors.text.primary }}>
                      <span className="font-semibold">{item.user}</span> {item.action}{' '}
                      <span className="font-medium" style={{ color: colors.primary.main }}>{item.target}</span>
                    </p>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>{item.time}</p>
                  </div>
                  <MoreHorizontal size={16} style={{ color: colors.text.tertiary }} className="cursor-pointer hover:scale-110 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h3 className="font-semibold mb-3" style={{ color: colors.text.primary }}>Platform Distribution</h3>
              <div className="h-48"><Doughnut data={platformData} options={doughnutOptions} /></div>
            </div>

            <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h3 className="font-semibold mb-3" style={{ color: colors.text.primary }}>Quick Links</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickLinks.map((link, i) => (
                  <button key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:scale-105 hover:rotate-1" style={{ backgroundColor: `${colors.primary.main}15`, color: colors.primary.main }}>
                    {link.icon}
                    <span className="text-xs font-medium">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks and Files */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>Upcoming Tasks</h3>
              <button className="text-sm hover:underline transition-all" style={{ color: colors.primary.main }}>Add Task</button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]" style={{ backgroundColor: colors.background.secondary }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: event.type === 'meeting' ? `${colors.primary.main}20` : `${colors.accent.rose}20`, color: event.type === 'meeting' ? colors.primary.main : colors.accent.rose }}>
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{event.title}</p>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>{event.time} • {event.date}</p>
                  </div>
                  <Circle size={16} style={{ color: colors.text.tertiary }} className="cursor-pointer hover:scale-110 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>Recent Files</h3>
              <button className="text-sm hover:underline transition-all" style={{ color: colors.primary.main }}>View All</button>
            </div>
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]" style={{ backgroundColor: colors.background.secondary }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.text.tertiary}20`, color: colors.text.secondary }}>
                    {file.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{file.name}</p>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>{file.size} • {file.date}</p>
                  </div>
                  <MoreHorizontal size={16} style={{ color: colors.text.tertiary }} className="cursor-pointer hover:scale-110 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shooting-star {
          0% {
            transform: translateX(-100px) translateY(-100px) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translateX(200px) translateY(200px) rotate(45deg);
            opacity: 0;
          }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        .animate-shooting-star {
          animation: shooting-star 3s linear infinite;
        }
      `}</style>
    </div>
  );
}