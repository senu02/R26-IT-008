// components/User/UserProfile/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  Home, 
  Search, 
  Compass, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Menu,
  Moon,
  Sun,
  Settings,
  Users,
  LayoutDashboard,
  Grid3X3,
  LifeBuoy,
  UserPlus,
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
  Gift,
  Eye,
  Fingerprint
} from 'lucide-react';
import { notificationAPI } from '@/app/services/notifications/actions';
import { getCurrentUserData, getImageUrl, authAPI } from '@/lib/api';
import Image from 'next/image';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Get user data and fetch notifications
  useEffect(() => {
    if (!mounted) return;
    
    const currentUser = getCurrentUserData();
    if (currentUser) {
      const avatarUrl = getImageUrl(currentUser.profile_picture);
      setUserAvatar(avatarUrl || 'https://i.pravatar.cc/150?img=11');
    } else {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.profile_picture) {
            const avatarUrl = getImageUrl(user.profile_picture);
            setUserAvatar(avatarUrl || 'https://i.pravatar.cc/150?img=11');
          } else if (user?.avatar) {
            const avatarUrl = getImageUrl(user.avatar);
            setUserAvatar(avatarUrl || 'https://i.pravatar.cc/150?img=11');
          }
        }
      } catch {
        setUserAvatar('https://i.pravatar.cc/150?img=11');
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [mounted]);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadNotifications(data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);
  const openMobileSidebar = () => setIsMobileOpen(true);

  const handleNavigation = (href: string) => {
    router.push(href);
    closeMobileSidebar();
    setShowMoreMenu(false);
  };

  const handleSettingsNavigation = (href: string) => {
    router.push(href);
    setIsSettingsOpen(false);
    closeMobileSidebar();
    setShowMoreMenu(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
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

  // Main navigation items
  const mainNavItems = [
    { name: 'Home', icon: Home, href: '/home' },
    { name: 'Friends', icon: Users, href: '/friends' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Messages', icon: MessageCircle, href: '/messages' },
    { name: 'Notifications', icon: Heart, href: '/notifications', badge: unreadNotifications },
    { name: 'Create', icon: PlusSquare, href: '/create' },
    { 
      name: 'Profile', 
      icon: () => (
        <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden">
          <img src={userAvatar} alt="profile" className="h-full w-full object-cover" />
        </div>
      ), 
      href: '/users/user-profile' 
    },
  ];

  // Settings options with separate Privacy and Security tabs
  const settingsOptions = [
    { 
      name: 'Profile Settings', 
      icon: UserCircle, 
      href: '/users/user-settings?section=profile', 
      description: 'Manage your personal info & security' 
    },
    { 
      name: 'Appearance', 
      icon: Palette, 
      href: '/users/user-settings?section=appearance', 
      description: 'Theme & display settings' 
    },
    { 
      name: 'Privacy', 
      icon: Eye, 
      href: '/users/user-settings?section=privacy', 
      description: 'Control your privacy settings',
      isNew: true
    },
    { 
      name: 'Security', 
      icon: Fingerprint, 
      href: '/users/user-settings?section=security', 
      description: 'Password & security options',
      isNew: true
    },
  ];

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
      
      {/* Main Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 h-full 
        ${isMobileOpen ? 'w-72' : 'w-[72px]'}
        lg:w-[245px]
        transform shadow-2xl transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isDark ? 'bg-black/40 backdrop-blur-xl border-r border-white/10' : 'bg-white/40 backdrop-blur-xl border-r border-white/50'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo Area */}
          <div className={`flex items-center justify-between px-3 py-4 ${isDark ? 'border-white/10' : 'border-white/30'} border-b`}>
            <Link href="/home" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                />
              </div>
              <span className={`text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent hidden lg:block ${isMobileOpen && 'block'}`}>
                PURE-TALK
              </span>
            </Link>
            <button 
              onClick={closeMobileSidebar} 
              className={`rounded-lg p-1.5 transition-all hover:bg-white/10 lg:hidden ${isMobileOpen ? 'block' : 'hidden'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {mainNavItems.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? `${isDark ? 'bg-white/15 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'} text-blue-500 shadow-sm`
                      : isDark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-white/30'
                    }
                    hover:scale-[1.02]
                    ${(isMobileOpen || window.innerWidth >= 1024) ? 'justify-start' : 'justify-center'}
                  `}
                >
                  <div className="relative flex items-center justify-center">
                    {typeof item.icon === 'function' ? <item.icon /> : <item.icon className={`h-5 w-5 transition-all ${isActive ? 'text-blue-500 scale-110' : ''}`} />}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#fd297b] px-1 text-[10px] font-bold text-white border-2 border-[var(--background)] animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`${(isMobileOpen || window.innerWidth >= 1024) ? 'block' : 'hidden'}`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-8 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section - Keeping original styles for Help Center, Settings, Logout */}
          <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
            <div className="space-y-1">
              {/* Help Center - Original Style */}
              <button 
                onClick={() => handleNavigation('/help')}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isDark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-white/30'
                } hover:scale-[1.02] ${(isMobileOpen || window.innerWidth >= 1024) ? 'justify-start' : 'justify-center'}`}
              >
                <LifeBuoy className={`h-5 w-5 ${isDark ? 'text-white/40' : 'text-slate-500'}`} />
                <span className={`${(isMobileOpen || window.innerWidth >= 1024) ? 'block' : 'hidden'}`}>Help Center</span>
              </button>
              
              {/* Settings - Original Style with Privacy & Security tabs */}
              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSettingsActive() 
                      ? `bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-500 ${(isMobileOpen || window.innerWidth >= 1024) ? 'justify-start' : 'justify-center'}`
                      : isDark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-white/30'
                  } hover:scale-[1.02] ${(isMobileOpen || window.innerWidth >= 1024) ? 'justify-start' : 'justify-center'}`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`h-5 w-5 transition-all ${isSettingsActive() ? 'text-blue-500' : isDark ? 'text-white/40' : 'text-slate-500'}`} />
                    <span className={`${(isMobileOpen || window.innerWidth >= 1024) ? 'block' : 'hidden'}`}>Settings</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-all duration-300 ${(isMobileOpen || window.innerWidth >= 1024) ? 'block' : 'hidden'} ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Settings Dropdown - With Privacy & Security as separate tabs */}
                {isSettingsOpen && (isMobileOpen || window.innerWidth >= 1024) && (
                  <div className={`mt-2 rounded-xl overflow-hidden shadow-xl animate-in slide-in-from-top-2 duration-200 ${
                    isDark ? 'bg-black/40 backdrop-blur-xl border border-white/15' : 'bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg'
                  }`}>
                    <div className="p-1">
                      {settingsOptions.map((option) => {
                        const isActive = pathname === option.href.split('?')[0] && getCurrentSection() === option.href.split('section=')[1];
                        return (
                          <button
                            key={option.name}
                            onClick={() => handleSettingsNavigation(option.href)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                              isActive
                                ? `${isDark ? 'bg-white/15' : 'bg-white/60'} text-blue-500`
                                : isDark ? 'text-white/70 hover:bg-white/10' : 'text-slate-600 hover:bg-white/30'
                            } hover:translate-x-1 relative`}
                          >
                            <option.icon className={`h-4 w-4 transition-all group-hover:scale-110 ${isActive ? 'text-blue-500' : ''}`} />
                            <div className="flex-1 text-left">
                              <div className="font-medium flex items-center gap-2">
                                {option.name}
                                {option.isNew && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                                  }`}>
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{option.description}</div>
                            </div>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout - Original Style */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                } hover:scale-[1.02] ${(isMobileOpen || window.innerWidth >= 1024) ? 'justify-start' : 'justify-center'}`}
              >
                <LogOut className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span className={`${(isMobileOpen || window.innerWidth >= 1024) ? 'block' : 'hidden'}`}>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>

              {/* Premium Badge */}
              {(isMobileOpen || window.innerWidth >= 1024) && (
                <div className={`mt-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20`}>
                    <Crown className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-500">Premium Member</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}