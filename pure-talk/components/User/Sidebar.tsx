"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Compass, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Users
} from 'lucide-react';
import { notificationAPI } from '@/app/services/notifications/actions';
import { getCurrentUserData, getImageUrl } from '@/lib/api';
import Image from 'next/image';

const Sidebar = () => {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
        className="fixed left-0 top-0 z-50 flex h-screen w-[72px] shrink-0 flex-col overflow-y-auto border-r border-red-500/20 bg-gradient-to-b from-[#1c0a10] via-[#0f172a] to-[#080d19] text-slate-100 lg:w-[245px] lg:items-start xl:w-[245px] transition-colors duration-300 shadow-[8px_0_30px_rgba(0,0,0,0.5)]"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        
        {/* Modern "PT" Monogram Logo Area */}
        <div className="mb-8 mt-4 flex w-full items-center justify-center lg:justify-start lg:px-4">
          
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

        {/* Navigation */}
        <div className="flex w-full flex-col gap-2">
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
            icon={<Heart className="h-6 w-6" />} 
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
              <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden">
                <img src={userAvatar} alt="profile" className="h-full w-full object-cover" />
              </div>
            } 
            label="Profile" 
            active={pathname === '/users/user-profile' || pathname === '/profile'} 
          />
        </div>

      </div>

      {/* Notifications Sliding Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-[72px] lg:left-[245px] w-[350px] sm:w-[400px] bg-gradient-to-b from-[#1c0a10] via-[#0f172a] to-[#080d19] border-r border-red-500/20 text-slate-100 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
          showNotifications ? 'translate-x-0' : '-translate-x-full hidden'
        }`}
      >
        <div className="h-full overflow-y-auto" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
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