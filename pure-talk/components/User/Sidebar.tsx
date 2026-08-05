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
        className="fixed left-0 top-0 z-50 flex h-screen w-[72px] shrink-0 flex-col overflow-y-auto border-r border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] lg:w-[245px] lg:items-start xl:w-[245px] transition-colors duration-200"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        
        {/* Advanced Logo Area */}
        <div className="mb-10 mt-2 flex w-full items-center justify-center lg:justify-start lg:pl-3">
          
          {/* Desktop Logo */}
          <Link href="/home" className="hidden lg:flex items-center gap-3 group cursor-pointer relative py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={36} 
                height={36} 
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              PURE-TALK
            </h1>
          </Link>

          {/* Mobile Logo Collapse */}
          <Link href="/home" className="block lg:hidden group relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
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
            href="#" 
            icon={<Compass className="h-6 w-6" />} 
            label="Explore" 
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
        className={`fixed top-0 bottom-0 left-[72px] lg:left-[245px] w-[350px] sm:w-[400px] bg-[var(--background)] border-r border-[var(--ig-border)] shadow-xl z-40 transition-transform duration-300 ease-in-out ${
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
        group relative flex items-center justify-center gap-4 rounded-lg p-3 
        transition-all duration-200 ease-in-out
        hover:bg-black/5 dark:hover:bg-white/10 
        lg:justify-start
        ${active ? 'font-bold' : 'font-normal'}
      `}
    >
      <div className={`
        relative transition-all duration-200 ease-in-out
        group-hover:scale-105
        flex items-center justify-center
        ${active ? 'text-blue-500' : 'text-[var(--foreground)]'}
        ${!active && 'group-hover:text-blue-400'}
      `}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#fd297b] px-1 text-[10px] font-bold text-white border-2 border-[var(--background)] animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`
        hidden lg:block text-[15px] transition-colors duration-200 ease-in-out
        ${active ? 'text-blue-500' : 'text-[var(--foreground)]'}
        ${!active && 'group-hover:text-blue-400'}
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