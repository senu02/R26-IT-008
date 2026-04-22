// components/User/UserProfile/ActivityCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, MessageCircle, Clock, Folder, Image, File, AlertCircle, Info } from 'lucide-react';
import { getTheme } from '@/context/theme';

const recentActivities = [
  { date: '2024-01-15', description: 'You updated the <a href="#" class="font-medium transition-colors hover:underline">Mobile App Design</a> project', time: '2 hours ago' },
  { date: '2024-01-14', description: 'New comment on <a href="#" class="font-medium transition-colors hover:underline">Dashboard UI</a>', time: 'yesterday' },
  { date: '2024-01-13', description: '<a href="#" class="font-medium transition-colors hover:underline">Sarah Johnson</a> assigned you a task', time: '2 days ago' },
  { date: '2024-01-12', description: 'You completed <a href="#" class="font-medium transition-colors hover:underline">User Research</a> milestone', time: '3 days ago' },
];

const recentTasks = [
  { title: 'Design system updates', progress: '5/19', comments: 3, users: ['JD', 'MK'] },
  { title: 'Client feedback review', progress: '12/24', comments: 7, users: ['SW', 'NP', 'ML'] },
  { title: 'Prepare presentation', progress: '3/8', comments: 1, users: ['AG'] },
];

const uploadedFiles = [
  { name: 'Brand Guidelines.pdf', type: 'Design', icon: File, users: ['NT', 'JD'] },
  { name: 'Wireframes.fig', type: 'Design', icon: Image, users: ['MK'] },
  { name: 'Project Proposal.docx', type: 'Documents', icon: FileText, users: ['SW', 'NP'] },
  { name: 'Style Guide.png', type: 'Design', icon: Folder, users: ['ML', 'AG'] },
];

export function ActivityCard() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const theme = getTheme(isDark);

  return (
    <div className="space-y-6">
      {/* Recent Activity Card */}
      <div className={`overflow-hidden rounded-2xl shadow-xl transition-all duration-200 ${theme.surface.glass} ${theme.surface.border}`}>
        <div className={`flex items-center justify-between border-b p-5 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
          <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Recent Activity</h2>
          <a href="#" className={`text-sm font-medium transition-colors hover:underline ${theme.accent.primary}`}>
            See all updates
          </a>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-white/30'}`}>
          {recentActivities.map((activity, idx) => (
            <div key={idx} className={`flex gap-3 p-5 transition-all duration-150 ${theme.surface.glassHover}`}>
              <div className="flex-shrink-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm ${isDark ? 'bg-white/10' : 'bg-white/40'}`}>
                  <Clock className={`h-4 w-4 ${theme.accent.primary}`} />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p 
                  className={`text-sm ${theme.text.secondary}`}
                  dangerouslySetInnerHTML={{ 
                    __html: activity.description.replace(
                      /<a /g, 
                      `<a class="${theme.accent.primary} hover:underline" `
                    ) 
                  }} 
                />
                <p className={`text-xs ${theme.text.muted}`}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks Card */}
      <div className={`overflow-hidden rounded-2xl shadow-xl transition-all duration-200 ${theme.surface.glass} ${theme.surface.border}`}>
        <div className={`border-b p-5 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
          <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Recent Tasks</h2>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-white/30'}`}>
          {recentTasks.map((task, idx) => (
            <div key={idx} className={`p-5 transition-all duration-150 ${theme.surface.glassHover}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-medium ${theme.text.primary}`}>{task.title}</h3>
                <div className="flex -space-x-2">
                  {task.users.map((user, i) => (
                    <div key={i} className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium backdrop-blur-sm ${isDark ? 'border-white/20 bg-white/10 text-white/80' : 'border-white/50 bg-white/40 text-slate-700'}`}>
                      {user}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className={`flex items-center gap-4 ${theme.text.muted}`}>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${theme.accent.primary}`} />
                    <span>Progress: {task.progress}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-slate-500/70'}`} />
                    <span>{task.comments} comments</span>
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 h-1.5 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b]" 
                  style={{ width: `${(parseInt(task.progress.split('/')[0]) / parseInt(task.progress.split('/')[1])) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded Files Card */}
      <div className={`overflow-hidden rounded-2xl shadow-xl transition-all duration-200 ${theme.surface.glass} ${theme.surface.border}`}>
        <div className={`border-b p-5 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
          <h2 className={`text-lg font-semibold ${theme.text.primary}`}>Uploaded Files</h2>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-white/30'}`}>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-5 transition-all duration-150 ${theme.surface.glassHover}`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm ${isDark ? 'bg-white/10' : 'bg-white/40'} ${theme.accent.primary}`}>
                <file.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${theme.text.primary}`}>{file.name}</p>
                <span className={`text-xs ${theme.text.muted}`}>{file.type}</span>
              </div>
              <div className="flex -space-x-2">
                {file.users.map((user, i) => (
                  <div key={i} className={`relative flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium backdrop-blur-sm ${isDark ? 'border-white/20 bg-white/10 text-white/70' : 'border-white/50 bg-white/40 text-slate-600'}`}>
                    {user}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner - Using glass morphism instead */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <Info className={`h-5 w-5 ${theme.accent.primary} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-medium ${theme.text.primary}`}>Team Update</p>
            <p className={`text-xs mt-1 ${theme.text.muted}`}>
              New design assets available in the shared drive
            </p>
          </div>
        </div>
      </div>

      {/* Warning Banner - Using glass morphism instead */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 ${theme.accent.primary} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-medium ${theme.text.primary}`}>Attention Required</p>
            <p className={`text-xs mt-1 ${theme.text.muted}`}>
              3 tasks are overdue. Please review them as soon as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}