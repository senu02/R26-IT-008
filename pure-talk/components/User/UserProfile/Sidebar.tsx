// components/User/UserProfile/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  LifeBuoy,
  Settings,
  Home,
  UserPlus,
  Bell,
  X,
  User,
  Activity,
  FileText,
  CreditCard,
  Shield,
  ChevronDown,
  LogOut,
  UserCircle,
  Key,
  Palette,
  Bell as BellIcon,
  Lock,
  Sparkles,
  Crown,
  Gift
} from 'lucide-react';
import { getTheme } from '@/context/theme';

const navigation = [
  { name: 'Profile', icon: User, href: '/users/user-profile', current: false },
  { name: 'Friends', icon: Users, href: '/friends', current: false },
  { name: 'Groups', icon: Grid3X3, href: '/groups', current: false },
  { name: 'Activities', icon: Activity, href: '/activities', current: false },
  { name: 'Notifications', icon: Bell, href: '/notifications', current: false },
  { name: 'Add Friends', icon: UserPlus, href: '/add-friends', current: false },
];

const settingsOptions = [
  { name: 'Profile Settings', icon: UserCircle, href: '/users/user-settings?section=profile', description: 'Manage your personal info & security' },
  { name: 'Appearance', icon: Palette, href: '/users/user-settings?section=appearance', description: 'Theme & display' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const openMobileSidebar = () => {
    setIsMobileOpen(true);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    closeMobileSidebar();
  };

  const handleSettingsNavigation = (href: string) => {
    router.push(href);
    setIsSettingsOpen(false);
    closeMobileSidebar();
  };

  const isActivePath = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isSettingsActive = () => {
    return pathname === '/users/user-settings';
  };

  const getCurrentSection = () => {
    return searchParams.get('section');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={openMobileSidebar} 
        className={`fixed left-4 top-4 z-40 rounded-xl p-2.5 shadow-lg backdrop-blur-md lg:hidden transition-all ${
          isDark ? 'bg-black/40 text-white' : 'bg-white/60 text-slate-700'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
      </button>
      
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
          onClick={closeMobileSidebar} 
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-full w-72 transform shadow-2xl transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-30
        ${isDark ? 'bg-black/40 backdrop-blur-xl border-r border-white/10' : 'bg-white/40 backdrop-blur-xl border-r border-white/50'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`flex items-center justify-between px-5 py-6 ${isDark ? 'border-white/10' : 'border-white/30'} border-b`}>
            <div 
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#fd297b] to-[#ff655b] shadow-lg transition-transform group-hover:scale-105">
                <span className="text-sm font-bold text-white">P</span>
              </div>
              <span className={`text-xl font-bold tracking-tight bg-gradient-to-r from-[#fd297b] to-[#ff655b] bg-clip-text text-transparent`}>PURE-TALK</span>
            </div>
            <button 
              onClick={closeMobileSidebar} 
              className={`rounded-lg p-1.5 ${theme.text.muted} hover:${theme.text.secondary} lg:hidden transition-all hover:bg-white/10`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? `${isDark ? 'bg-white/15 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'} text-[#fd297b] shadow-sm`
                      : theme.text.secondary
                    }
                    hover:${isDark ? 'bg-white/8' : 'bg-white/30'} hover:scale-[1.02]
                  `}
                >
                  <item.icon className={`h-5 w-5 transition-all ${isActive ? 'text-[#fd297b] scale-110' : isDark ? 'text-white/40 group-hover:text-white/60' : 'text-slate-500/70 group-hover:text-slate-700'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b from-[#fd297b] to-[#ff655b]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section with Settings Dropdown */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
            <div className="space-y-2">
              <button 
                onClick={() => handleNavigation('/help')}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${theme.text.secondary} hover:${isDark ? 'bg-white/8' : 'bg-white/30'} hover:scale-[1.02]`}
              >
                <LifeBuoy className={`h-5 w-5 ${theme.text.muted}`} />
                <span>Help Center</span>
              </button>
              
              {/* Settings Dropdown - Enhanced */}
              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSettingsActive() ? 'bg-gradient-to-r from-[#fd297b]/20 to-[#ff655b]/20 text-[#fd297b]' : theme.text.secondary
                  } hover:${isDark ? 'bg-white/8' : 'bg-white/30'} hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`h-5 w-5 transition-all ${isSettingsActive() ? 'text-[#fd297b]' : theme.text.muted}`} />
                    <span>Settings</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Enhanced Dropdown Menu */}
                {isSettingsOpen && (
                  <div className={`mt-2 rounded-xl overflow-hidden shadow-xl animate-in slide-in-from-top-2 duration-200 ${
                    isDark ? 'bg-black/60 backdrop-blur-xl border border-white/15' : 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg'
                  }`}>
                    <div className="p-1">
                      {settingsOptions.map((option) => (
                        <button
                          key={option.name}
                          onClick={() => handleSettingsNavigation(option.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                            pathname === option.href.split('?')[0] && getCurrentSection() === option.href.split('section=')[1]
                              ? `${isDark ? 'bg-white/15' : 'bg-white/60'} text-[#fd297b]`
                              : theme.text.secondary
                          } hover:${isDark ? 'bg-white/10' : 'bg-white/40'} hover:translate-x-1`}
                        >
                          <option.icon className={`h-4 w-4 transition-all group-hover:scale-110 ${pathname === option.href.split('?')[0] && getCurrentSection() === option.href.split('section=')[1] ? 'text-[#fd297b]' : ''}`} />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{option.name}</div>
                            <div className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{option.description}</div>
                          </div>
                          {pathname === option.href.split('?')[0] && getCurrentSection() === option.href.split('section=')[1] && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Premium Badge */}
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#fd297b]/20 to-[#ff655b]/20`}>
                  <Crown className="h-4 w-4 text-[#fd297b]" />
                  <span className="text-xs font-medium text-[#fd297b]">Premium Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}