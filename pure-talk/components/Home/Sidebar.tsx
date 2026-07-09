"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { notificationAPI } from '@/lib/api';
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
  Users
} from 'lucide-react';
import { getCurrentUserAvatar } from '@/app/services/posts/actions';
import { NotificationList } from '@/components/User/Notifications/NotificationList';

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
    
    // Real user avatar
    const avatar = getCurrentUserAvatar();
    if (avatar && avatar !== 'null' && avatar !== 'undefined') {
      setUserAvatar(avatar);
    } else {
      // Fallback to random demo avatar if no profile picture
      const savedAvatar = localStorage.getItem('demo_user_avatar');
      if (savedAvatar) {
        setUserAvatar(savedAvatar);
      } else {
        const demoAvatars = [
          'https://i.pravatar.cc/150?img=1',
          'https://i.pravatar.cc/150?img=2',
          'https://i.pravatar.cc/150?img=11',
        ];
        const randomAvatar = demoAvatars[Math.floor(Math.random() * demoAvatars.length)];
        setUserAvatar(randomAvatar);
        localStorage.setItem('demo_user_avatar', randomAvatar);
      }
    }

    // Fetch notifications count
    const fetchNotifications = async () => {
      try {
        const data = await notificationAPI.getUnreadCount();
        setUnreadNotifications(data.unread_count);
      } catch (error) {
        console.error('Failed to fetch unread notifications count:', error);
      }
    };
    fetchNotifications();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              PURE-TALK
            </h1>
          </Link>

          {/* Mobile Logo Collapse */}
          <Link href="/home" className="block lg:hidden group relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105">
              <span className="font-bold text-sm text-white">P</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex w-full flex-col gap-2">
          <NavItem href="/home" icon={<Home className="h-6 w-6" />} label="Home" active={pathname === '/home'} />
          <NavItem href="/users/friends" icon={<Users className="h-6 w-6" />} label="Friends" active={pathname === '/friends'} />
          <NavItem href="#" icon={<Compass className="h-6 w-6" />} label="Explore" />
          <NavItem href="#" icon={<MessageCircle className="h-6 w-6" />} label="Messages" />
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:justify-start ${showNotifications ? 'font-bold' : 'font-normal'}`}
          >
            <div className="relative transition-transform group-hover:scale-105">
              <Heart className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </div>
              )}
            </div>
            <span className="hidden lg:block text-[15px]">Notifications</span>
          </button>

          <NavItem href="#" icon={<PlusSquare className="h-6 w-6" />} label="Create" />
          <NavItem 
            href="/users/user-profile" 
            icon={<div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden"><img src={userAvatar} alt="profile" className="h-full w-full object-cover" /></div>} 
            label="Profile" 
            active={pathname === '/users/user-profile'}
          />
        </div>

        {/* Bottom More Menu Trigger */}
        <div className="mt-auto flex w-full flex-col relative">
          
          {/* Pop-up More Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-14 left-0 flex w-[220px] flex-col rounded-lg bg-[var(--background)] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[var(--ig-border)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08)]">
              <Link
                href="/users/user-settings"
                className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>

              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center justify-between rounded-md p-3 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>Switch Appearance</span>
                </div>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:justify-start ${showMoreMenu ? 'font-bold' : 'font-normal'}`}
          >
            <div className={`transition-transform group-hover:scale-105 ${showMoreMenu ? '*:stroke-[3px]' : ''}`}>
              <Menu className="h-6 w-6" />
            </div>
            <span className="hidden lg:block text-[15px]">More</span>
          </button>
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

const NavItem = ({ href, icon, label, active = false, badge }: { href: string, icon: React.ReactNode, label: string, active?: boolean, badge?: number }) => {
  return (
    <Link
      href={href}
      className={`group relative flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:justify-start ${active ? 'font-bold' : 'font-normal'}`}
    >
      <div className={`relative transition-transform group-hover:scale-105 ${active ? '*:stroke-[3px] text-blue-500' : ''}`}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white border-2 border-[var(--background)]">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`hidden lg:block text-[15px] ${active ? 'text-blue-500' : ''}`}>{label}</span>
    </Link>
  );
};

export default Sidebar;