// components/User/UserProfile/ProfileCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckSquare, HardDrive, MapPin, Briefcase, Mail, Calendar } from 'lucide-react';
import { getTheme } from '@/context/theme';
import { getCurrentUserData, getImageUrl } from '@/lib/api';

const tabs = [
  { name: 'Activity', key: 'activity', icon: Activity },
  { name: 'Assigned Tasks', key: 'assigned', icon: CheckSquare },
  { name: 'Storage', key: 'storage', icon: HardDrive },
];

const tags = ['Business', 'Management', 'UI/UX', 'Development', 'Marketing'];

export function ProfileCard() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');
  const [userData, setUserData] = useState<{ full_name?: string; email?: string; profile_picture?: string | null } | null>(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    const currentUser = getCurrentUserData();
    if (currentUser) {
      setUserData(currentUser);
    }
    
    return () => observer.disconnect();
  }, []);

  const theme = getTheme(isDark);

  return (
    <div className={`overflow-hidden rounded-2xl shadow-xl transition-all duration-200 ${theme.surface.glass} ${theme.surface.border}`}>
      {/* Cover gradient - Wider and fixed size */}
      <div className="relative h-48 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"></div>

      {/* Avatar - positioned to overlap cover */}
      <div className="relative px-6 -mt-16">
        <div className={`inline-flex rounded-full border-4 shadow-lg ${isDark ? 'border-white/20 bg-white/10' : 'border-white/60 bg-white/40'} backdrop-blur-sm`}>
          <div className="h-28 w-28 overflow-hidden rounded-full md:h-32 md:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userData?.profile_picture ? getImageUrl(userData.profile_picture) : `https://ui-avatars.com/api/?background=3b82f6&color=fff&size=128&name=${userData?.full_name || userData?.email || 'User'}`}
              alt={userData?.full_name || 'User Profile'}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 mt-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text.primary}`}>{userData?.full_name || userData?.email?.split('@')[0] || 'User Profile'}</h1>
          <p className={`text-sm ${theme.text.secondary} mt-1`}>Member</p>
          
          {/* User details */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1">
              <MapPin className={`h-3.5 w-3.5 ${theme.text.muted}`} />
              <span className={`text-xs ${theme.text.secondary}`}>Global</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className={`h-3.5 w-3.5 ${theme.text.muted}`} />
              <span className={`text-xs ${theme.text.secondary}`}>Community</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className={`h-3.5 w-3.5 ${theme.text.muted}`} />
              <span className={`text-xs ${theme.text.secondary}`}>{userData?.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className={`h-3.5 w-3.5 ${theme.text.muted}`} />
              <span className={`text-xs ${theme.text.secondary}`}>Active Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`mt-6 border-b px-6 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? `border-b-2 ${theme.accent.primary}`
                  : theme.text.muted
              }`}
              style={activeTab === tab.key ? { borderBottomColor: '#3b82f6' } : {}}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'assigned' && (
          <div className="space-y-4">
            <p className={`text-sm ${theme.text.secondary}`}>
              I am a passionate UI/UX Designer with over 8 years of experience in creating digital products that are both functional and aesthetically pleasing. 
              I believe that design is not just how it looks but how it works.
            </p>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 backdrop-blur-sm ${
                    isDark 
                      ? 'bg-white/10 text-white/80 hover:bg-white/20' 
                      : 'bg-white/40 text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
                <p className={`text-xs font-medium ${theme.text.muted}`}>Active Projects</p>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>12</p>
              </div>
              <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
                <p className={`text-xs font-medium ${theme.text.muted}`}>Completed Tasks</p>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>48</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
              <p className={`text-sm ${theme.text.secondary}`}>
                🎉 You completed 3 tasks this week!
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/40 border border-white/50'} backdrop-blur-sm`}>
              <p className={`text-sm ${theme.text.secondary}`}>
                ⚠️ 2 pending reviews need your attention
              </p>
            </div>
            <p className={`text-sm ${theme.text.muted}`}>More activity details will appear here...</p>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-4">
            {/* Storage Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={theme.text.secondary}>Used Space</span>
                <span className={theme.text.muted}>2.4 GB / 10 GB</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: '24%' }}></div>
              </div>
            </div>
            
            {/* Storage Stats */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.text.secondary}`}>Documents</span>
                <span className={`text-sm ${theme.text.muted}`}>1.2 GB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.text.secondary}`}>Images</span>
                <span className={`text-sm ${theme.text.muted}`}>800 MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.text.secondary}`}>Others</span>
                <span className={`text-sm ${theme.text.muted}`}>400 MB</span>
              </div>
            </div>
            
            <button className={`w-full rounded-xl border px-4 py-2 text-sm font-medium transition-all backdrop-blur-sm ${
              isDark 
                ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20' 
                : 'border-white/50 bg-white/30 text-slate-700 hover:bg-white/50'
            }`}>
              Upgrade Storage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}