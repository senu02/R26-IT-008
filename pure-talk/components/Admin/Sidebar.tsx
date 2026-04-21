// components/Admin/Sidebar.tsx (Updated with Videos Tab + Profile Image)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  X,
  ChevronDown,
  User,
  Shield,
  HelpCircle,
  Folder,
  BarChart3,
  LogOut,
  Sparkles,
  Bell,
  Search,
  Rocket,
  Users,
  Loader2,
  Video
} from 'lucide-react';
import { useThemeColors } from '@/context/adminTheme';
import { authAPI } from '@/lib/api';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/admin/dashboard', badge: null },
  { icon: <Users size={18} />, label: 'User Management', href: '/admin/user-management', badge: null },
  { icon: <Video size={18} />, label: 'Videos', href: '/admin/videos', badge: null },
  { icon: <BarChart3 size={18} />, label: 'Analytics', href: '/admin/analytics', badge: 'New' },
];

const sidebarBottom = [
  { icon: <HelpCircle size={18} />, label: 'Help Center', href: '/admin/help' },
  { icon: <Shield size={18} />, label: 'Privacy', href: '/admin/privacy' },
  { icon: <Settings size={18} />, label: 'Settings', href: '/admin/settings' },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { colors, theme } = useThemeColors();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string; role?: string; profile_picture?: string | null } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Get user data from localStorage
    const getUserData = () => {
      try {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // Get full media URL for profile picture
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const profilePicture = user.profile_picture 
            ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE_URL}${user.profile_picture}`)
            : null;
          
          setUserData({
            name: user.full_name || user.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: user.role,
            profile_picture: profilePicture
          });
        } else {
          // Fallback data
          setUserData({
            name: 'John Doe',
            email: 'john@puretalk.com',
            role: 'admin'
          });
        }
      } catch (error) {
        setUserData({
          name: 'User',
          email: 'user@puretalk.com'
        });
      }
    };
    getUserData();
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigation = () => {
    setIsNavigating(true);
    setSidebarOpen(false);
    // Reset navigation state after animation
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('Token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
      setProfileOpen(false);
    }
  };

  if (!mounted) {
    return (
      <aside className="fixed lg:relative z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600" />
            <span className="font-bold text-lg text-slate-800 dark:text-white">PURE TALK</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3" />
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="w-full flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mt-1" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const getLogoIcon = () => {
    if (theme === 'space') {
      return <Rocket size={16} className="text-white" />;
    }
    return <Sparkles size={16} className="text-white" />;
  };

  const getLogoGradient = () => {
    if (theme === 'space') {
      return 'from-purple-500 to-cyan-500';
    }
    if (theme === 'dark') {
      return 'from-indigo-500 to-purple-600';
    }
    return 'from-indigo-500 to-purple-600';
  };

  const getUserInitials = () => {
    if (!userData?.name) return 'JD';
    return userData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImageUrl = () => {
    if (userData?.profile_picture) {
      return userData.profile_picture;
    }
    return null;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
            theme === 'space' ? 'backdrop-blur-md bg-black/70' : 'bg-black/50 backdrop-blur-sm'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 w-72 flex flex-col transition-all duration-300 ease-out h-full shadow-xl lg:shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isNavigating ? 'opacity-50 pointer-events-none' : ''}
      `} 
      style={{ 
        backgroundColor: colors.surface.primary, 
        borderRightColor: colors.border.primary,
        ...(theme === 'space' && {
          backdropFilter: 'blur(10px)',
          background: `linear-gradient(180deg, ${colors.surface.primary} 0%, ${colors.background.primary} 100%)`,
        })
      }}>
        
        {/* Space theme decorative elements */}
        {theme === 'space' && (
          <>
            <div className="absolute top-20 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
          </>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b relative z-10" style={{ borderBottomColor: colors.border.primary }}>
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-2.5 group"
            onClick={handleNavigation}
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getLogoGradient()} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
              {getLogoIcon()}
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: colors.text.primary }}>PURE TALK</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-1 rounded-lg transition-all"
            style={{ color: colors.text.tertiary }}
            onMouseEnter={(e) => {
              if (!isNavigating) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-4 pb-2 relative z-10">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
                color: colors.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              onFocus={(e) => {
                if (!isNavigating) {
                  e.currentTarget.style.borderColor = colors.primary.main;
                  e.currentTarget.style.boxShadow = theme === 'space' 
                    ? `0 0 0 2px ${colors.primary.main}40, 0 0 10px ${colors.primary.main}20`
                    : `0 0 0 2px ${colors.primary.main}20`;
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.primary;
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={isNavigating}
            />
            {/* Space theme search glow */}
            {theme === 'space' && (
              <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" 
                style={{ boxShadow: `0 0 15px ${colors.primary.main}30` }} 
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar relative z-10">
          {/* Main Menu */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: colors.text.tertiary }}>
              Main Menu
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleNavigation}
                    className={`
                      group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isNavigating ? 'cursor-not-allowed' : ''}
                      ${theme === 'space' && isActive ? 'glow-effect' : ''}
                    `}
                    style={{
                      backgroundColor: isActive ? `${colors.primary.main}15` : 'transparent',
                      color: isActive ? colors.primary.main : colors.text.secondary
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !isNavigating) {
                        e.currentTarget.style.backgroundColor = colors.background.secondary;
                        e.currentTarget.style.color = colors.text.primary;
                        if (theme === 'space') {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !isNavigating) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.text.secondary;
                        if (theme === 'space') {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 transition-all duration-200 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary.main}20`, color: colors.primary.main }}>
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute right-3 w-2 h-2 rounded-full shadow-sm ${
                        theme === 'space' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-green-500 shadow-green-500/50'
                      }`} />
                    )}

                    {/* Space theme active glow */}
                    {isActive && theme === 'space' && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 pointer-events-none" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Support */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: colors.text.tertiary }}>
              Support
            </div>
            <nav className="space-y-1">
              {sidebarBottom.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleNavigation}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isNavigating ? 'cursor-not-allowed' : ''}
                      ${theme === 'space' && isActive ? 'glow-effect' : ''}
                    `}
                    style={{ 
                      backgroundColor: isActive ? `${colors.primary.main}15` : 'transparent',
                      color: isActive ? colors.primary.main : colors.text.secondary 
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !isNavigating) {
                        e.currentTarget.style.backgroundColor = colors.background.secondary;
                        e.currentTarget.style.color = colors.text.primary;
                        if (theme === 'space') {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !isNavigating) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.text.secondary;
                        if (theme === 'space') {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }
                    }}
                  >
                    <span className="shrink-0 transition-all duration-200 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute right-3 w-2 h-2 rounded-full shadow-sm ${
                        theme === 'space' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-green-500 shadow-green-500/50'
                      }`} />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: colors.background.secondary }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: colors.primary.main }} />
              <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>QUICK STATS</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: colors.text.tertiary }}>Total Users</span>
                <span className="text-sm font-bold" style={{ color: colors.text.primary }}>1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: colors.text.tertiary }}>Active Today</span>
                <span className="text-sm font-bold" style={{ color: colors.status.success }}>89</span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: colors.border.primary }}>
                <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: colors.primary.main }} />
              </div>
              <Link 
                href="/admin/user-management"
                onClick={handleNavigation}
                className="block text-center text-xs py-1 rounded-lg transition-all mt-1"
                style={{ color: colors.primary.main }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary.main}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                View All Users →
              </Link>
            </div>
          </div>

          {/* Space Theme Quote */}
          {theme === 'space' && (
            <div className="mt-4 p-3 rounded-xl text-center" style={{ backgroundColor: colors.background.secondary }}>
              <p className="text-xs italic" style={{ color: colors.text.tertiary }}>
                "To infinity and beyond"
              </p>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-150" />
                <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-300" />
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section with Profile Image */}
        <div className="p-3 border-t relative z-10" style={{ borderTopColor: colors.border.primary }}>
          <div className="relative">
            <button
              onClick={() => !isNavigating && !isLoggingOut && setProfileOpen(!profileOpen)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group ${isNavigating || isLoggingOut ? 'cursor-not-allowed' : ''}`}
              style={{ color: colors.text.primary }}
              onMouseEnter={(e) => {
                if (!isNavigating && !isLoggingOut) {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                  if (theme === 'space') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                if (theme === 'space') {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
              disabled={isLoggingOut}
            >
              <div className="relative">
                {getProfileImageUrl() ? (
                  <img 
                    src={getProfileImageUrl()!}
                    alt={userData?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover shadow-md"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = `w-10 h-10 rounded-full bg-gradient-to-br ${getLogoGradient()} flex items-center justify-center text-white font-semibold text-sm shadow-md`;
                        fallbackDiv.textContent = getUserInitials();
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getLogoGradient()} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                    {getUserInitials()}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${
                  theme === 'space' ? 'bg-cyan-400 border-cyan-400' : 'bg-green-500'
                }`} style={{ borderColor: colors.surface.primary }}></div>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold truncate max-w-[120px]" style={{ color: colors.text.primary }}>
                  {userData?.name || 'User'}
                </div>
                <div className="text-xs truncate max-w-[120px]" style={{ color: colors.text.tertiary }}>
                  {userData?.email || 'user@puretalk.com'}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-all duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                style={{ color: colors.text.tertiary }}
              />
            </button>
            
            {/* Profile Dropdown */}
            {profileOpen && !isNavigating && !isLoggingOut && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden" 
                  style={{ 
                    backgroundColor: colors.surface.primary, 
                    borderColor: colors.border.primary,
                    ...(theme === 'space' && {
                      backdropFilter: 'blur(10px)',
                      background: `linear-gradient(135deg, ${colors.surface.primary} 0%, ${colors.background.primary} 100%)`,
                    })
                  }}>
                  {/* Space theme dropdown glow */}
                  {theme === 'space' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 pointer-events-none" />
                  )}
                  
                  {/* User info in dropdown with profile image */}
                  <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderBottomColor: colors.border.light }}>
                    {getProfileImageUrl() ? (
                      <img 
                        src={getProfileImageUrl()!}
                        alt={userData?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getLogoGradient()} flex items-center justify-center text-white font-semibold text-sm`}>
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: colors.text.tertiary }}>Signed in as</p>
                      <p className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>
                        {userData?.email || 'user@puretalk.com'}
                      </p>
                      {userData?.role && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1" 
                          style={{ backgroundColor: `${colors.primary.main}15`, color: colors.primary.main }}>
                          {userData.role === 'super_admin' ? 'Super Admin' : userData.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link 
                    href="/admin/admin-profile" 
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 relative z-10"
                    style={{ color: colors.text.secondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.background.secondary;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={14} style={{ color: colors.text.tertiary }} />
                    <span>Your Profile</span>
                  </Link>
                  <Link 
                    href="/admin/settings" 
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 relative z-10"
                    style={{ color: colors.text.secondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.background.secondary;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={14} style={{ color: colors.text.tertiary }} />
                    <span>Account Settings</span>
                  </Link>
                  <hr className="my-1 relative z-10" style={{ borderColor: colors.border.light }} />
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: colors.status.error }}
                    onMouseEnter={(e) => {
                      if (!isLoggingOut) {
                        e.currentTarget.style.backgroundColor = `${colors.status.error}10`;
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'space' 
            ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' 
            : theme === 'dark' ? '#334155' : '#cbd5e1'};
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'space' 
            ? 'linear-gradient(135deg, #a78bfa, #22d3ee)' 
            : theme === 'dark' ? '#475569' : '#94a3b8'};
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .glow-effect {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}