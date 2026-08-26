"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Search, 
  Compass, 
  MessageCircle, 
  Heart,
  Bell,
  PlusSquare, 
  Users,
  Menu,
  Settings,
  LogOut,
  LifeBuoy,
  UserCircle,
  Palette,
  Crown,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { notificationAPI } from '@/app/services/notifications/actions';
import { getCurrentUserData, getImageUrl, authAPI } from '@/lib/api';
import Image from 'next/image';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  // Avoid hydration mismatch for theme
  useEffect(() => {
    // Get user data from localStorage
    const currentUser = getCurrentUserData();
    if (currentUser) {
      // Use getImageUrl to properly format the profile picture URL
      const avatarUrl = getImageUrl(currentUser.profile_picture);
      setUserAvatar(avatarUrl || 'https://i.pravatar.cc/150?img=11');
    } else {
      // Try to get from localStorage directly as fallback
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
        // Use default avatar
        setUserAvatar('https://i.pravatar.cc/150?img=11');
      }
    }

    // Fetch real unread count from API
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Listen for notification updates (if you have a global event system)
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadNotifications(data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't set to 0 on error, keep existing value
    }
  };

  return (
    <>
      <div
        className="fixed left-0 top-0 z-50 flex h-screen w-[72px] shrink-0 flex-col justify-between border-r border-pink-500/30 bg-[#1e1040] text-slate-100 lg:w-[245px] lg:items-start xl:w-[245px] transition-colors duration-300 shadow-[8px_0_35px_rgba(99,60,180,0.4)] py-4 overflow-hidden"
      >
        {/* Warm Indigo-Rose Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b5e] via-[#1a1040] to-[#0f0a2e] opacity-98 pointer-events-none" />
        <div className="absolute inset-0 bg-sidebar-dark-pattern opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-sidebar-grid-pattern opacity-20 pointer-events-none" />
        
        {/* Ambient Glow Spotlights — pink + blue friendly tones */}
        <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-pink-500/25 blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/2 -right-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none animate-pulse-slow delay-1000" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-600/25 blur-3xl pointer-events-none animate-pulse-slow delay-2000" />
        
        {/* Glowing right edge line — pink/violet */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-pink-400/60 via-violet-500/30 to-transparent pointer-events-none" />

        {/* Top Header & Logo Area */}
        <div className="relative z-10 w-full shrink-0">
          {/* Modern "PT" Monogram Logo Area */}
          <div className="mb-6 flex w-full items-center justify-center lg:justify-start lg:px-4">
            
            {/* Desktop Logo */}
            <Link href="/home" className="hidden lg:flex items-center gap-3.5 group cursor-pointer relative py-1">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-900 p-[1px] shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-red-500/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] group-hover:ring-red-400/60 overflow-hidden">
                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0f172a] bg-gradient-to-br from-[#1c0d12] to-[#0f172a]">
                  <span className="font-black text-lg tracking-tighter bg-gradient-to-r from-red-500 via-rose-400 to-white bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                    PT
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm leading-none">
                    PURE TALK
                  </h1>
                </div>
                <span className="text-[10px] tracking-[0.25em] text-red-500 uppercase font-bold mt-1.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  CONNECT
                </span>
              </div>
            </Link>

            {/* Mobile Logo Collapse */}
            <Link href="/home" className="block lg:hidden group relative">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-900 p-[1px] shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-red-500/40 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-gradient-to-br from-[#1c0d12] to-[#0f172a]">
                  <span className="font-black text-lg tracking-tighter bg-gradient-to-r from-red-500 via-rose-400 to-white bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                    PT
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="relative z-10 flex w-full flex-1 flex-col gap-1.5 px-2 overflow-y-auto scrollbar-none" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <NavItem 
            href="/home" 
            icon={<Home className="h-6 w-6" />} 
            label="Home" 
            active={pathname === '/home'} 
          />
          <NavItem 
            href="/users/friends" 
            icon={<Users className="h-6 w-6" />} 
            label="Friends" 
            active={pathname === '/friends' || pathname === '/users/friends'} 
          />
          <NavItem 
            href="/users/reels" 
            icon={<Compass className="h-6 w-6" />} 
            label="Reels" 
          />
          <NavItem 
            href="#" 
            icon={<MessageCircle className="h-6 w-6" />} 
            label="Messages" 
          />
          <NavItem 
            href="/users/notifications" 
            icon={<Bell className="h-6 w-6" />} 
            label="Notifications" 
            active={pathname === '/notifications' || pathname === '/users/notifications'} 
            badge={unreadNotifications}
          />
          <NavItem 
            href="#" 
            icon={<PlusSquare className="h-6 w-6" />} 
            label="Create" 
          />
          <NavItem 
            href="/users/user-profile" 
            icon={
              <div className="h-6 w-6 rounded-full bg-neutral-800 border border-rose-500/40 overflow-hidden">
                <img src={userAvatar} alt="profile" className="h-full w-full object-cover" />
              </div>
            } 
            label="Profile" 
            active={pathname === '/users/user-profile' || pathname === '/profile'} 
          />
        </div>

        {/* Bottom Pinned More Menu Trigger */}
        <div className="relative z-10 shrink-0 flex w-full flex-col px-2 pt-2">
          {/* Pop-up More Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-16 left-2 flex w-[230px] flex-col rounded-2xl bg-[#1e1040]/95 backdrop-blur-xl p-2 shadow-[0_10px_35px_rgba(99,60,180,0.5)] border border-pink-500/25 z-50 text-slate-100 sidebar-card-pattern">
              {/* Settings with submenu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettingsSubmenu(!showSettingsSubmenu)}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-sm transition-colors hover:bg-rose-500/10 text-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-rose-400" />
                    <span className="font-medium">Settings</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 text-slate-400 ${showSettingsSubmenu ? 'rotate-90' : ''}`}
                  />
                </button>

                {showSettingsSubmenu && (
                  <div className="ml-2 mt-1 flex flex-col border-l border-rose-500/20 pl-2 space-y-1">
                    <Link
                      href="/users/user-settings?section=profile"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowSettingsSubmenu(false);
                      }}
                      className="flex items-center gap-3 rounded-lg p-2.5 text-sm transition-colors hover:bg-rose-500/10 text-slate-300 hover:text-white"
                    >
                      <UserCircle className="h-4 w-4 text-rose-400" />
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-xs">Profile Settings</span>
                        <span className="text-[10px] text-slate-400">Personal info</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Help Center */}
              <Link
                href="/help-center"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 rounded-xl p-3 text-sm hover:bg-rose-500/10 text-slate-200 transition-colors"
              >
                <LifeBuoy className="h-5 w-5 text-rose-400" />
                <span className="font-medium">Help Center</span>
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-60 font-semibold"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>

              {/* Premium badge */}
              <div className="mt-1 flex items-center gap-2 rounded-xl border-t border-slate-700/60 px-3 pt-2.5 pb-1">
                <Crown className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400">Premium Member</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`group flex items-center justify-center gap-4 rounded-xl p-3 transition-colors hover:bg-rose-500/10 hover:text-white text-slate-300 lg:justify-start w-full ${
              showMoreMenu ? 'font-bold text-white bg-rose-500/15' : 'font-normal'
            }`}
          >
            <div className="transition-transform group-hover:scale-110">
              <Menu className="h-6 w-6 text-rose-400" />
            </div>
            <span className="hidden lg:block text-[15px] font-medium">More</span>
          </button>
        </div>

      </div>

      {/* Notifications Sliding Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-[72px] lg:left-[245px] w-[350px] sm:w-[400px] bg-[#1e1040] border-r border-pink-500/25 text-slate-100 shadow-2xl z-40 transition-transform duration-300 ease-in-out overflow-hidden ${
          showNotifications ? 'translate-x-0' : '-translate-x-full hidden'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b5e] via-[#1a1040] to-[#0f0a2e] opacity-95 pointer-events-none" />
        <div className="absolute inset-0 bg-sidebar-dark-pattern opacity-40 pointer-events-none" />
        <div className="relative z-10 h-full overflow-y-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <NotificationList />
        </div>
      </div>
      
      {/* Overlay to close the drawer when clicking outside */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

// FIXED NavItem Component with proper hover effects
const NavItem = ({ 
  href, 
  icon, 
  label, 
  active = false, 
  badge 
}: { 
  href: string, 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  badge?: number 
}) => {
  return (
    <Link
      href={href}
      className={`
        group relative flex items-center justify-center gap-4 rounded-xl p-3 
        transition-all duration-300 ease-out
        lg:justify-start
        ${active 
          ? 'bg-gradient-to-r from-red-600/25 via-rose-500/15 to-transparent border-l-4 border-rose-500 font-bold shadow-[inset_0_0_15px_rgba(244,63,94,0.15)]' 
          : 'hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent font-normal'}
      `}
    >
      <div className={`
        relative transition-all duration-300 ease-out
        group-hover:scale-110
        flex items-center justify-center
        ${active 
          ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]' 
          : 'text-slate-300 group-hover:text-rose-400'}
      `}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-1 text-[10px] font-extrabold text-white border-2 border-[#1c0a10] shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`
        hidden lg:block text-[15px] transition-colors duration-300 ease-out tracking-wide
        ${active 
          ? 'bg-gradient-to-r from-rose-400 via-red-400 to-white bg-clip-text text-transparent font-bold' 
          : 'text-slate-300 group-hover:text-white'}
      `}>
        {label}
      </span>
    </Link>
  );
};

// Placeholder component - you need to implement this or import it
const NotificationList = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Notifications</h2>
      <p className="text-gray-500">No notifications yet</p>
    </div>
  );
};

export default Sidebar;