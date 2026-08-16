// components/User/UserProfile/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Home,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  Moon,
  Sun,
  Settings,
  Users,
  LifeBuoy,
  ChevronRight,
  LogOut,
  UserCircle,
  Palette,
  Crown,
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
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);

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
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadNotifications(data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't reset to 0 on error, keep existing value
    }
  };

  const isSettingsActive = () => pathname === '/users/user-settings';
  const getCurrentSection = () => searchParams.get('section');

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

  const settingsOptions = [
    {
      name: 'Profile Settings',
      icon: UserCircle,
      href: '/users/user-settings?section=profile',
      description: 'Manage your personal info',
    },
    {
      name: 'Appearance',
      icon: Palette,
      href: '/users/user-settings?section=appearance',
      description: 'Theme & display settings',
    },
  ];

  return (
    <>
      <div
        className="fixed left-0 top-0 z-50 flex h-screen w-[72px] shrink-0 flex-col overflow-y-auto border-r border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] lg:w-[245px] lg:items-start xl:w-[245px] transition-colors duration-200"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {/* Logo Area */}
        <div className="mb-10 mt-2 flex w-full items-center justify-center lg:justify-start lg:pl-3">
          {/* Desktop Logo */}
          <Link href="/home" className="hidden lg:flex items-center gap-3 group cursor-pointer relative py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              PURE-TALK
            </h1>
          </Link>

          {/* Mobile Logo Collapse */}
          <Link href="/home" className="block lg:hidden group relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex w-full flex-col gap-2">
          <NavItem href="/home" icon={<Home className="h-6 w-6" />} label="Home" active={pathname === '/home'} />
          <NavItem
            href="/users/friends"
            icon={<Users className="h-6 w-6" />}
            label="Friends"
            active={pathname === '/friends' || pathname === '/users/friends'}
          />
          <NavItem href="/explore" icon={<Compass className="h-6 w-6" />} label="Explore" active={pathname === '/explore'} />
          <NavItem href="/messages" icon={<MessageCircle className="h-6 w-6" />} label="Messages" active={pathname === '/messages'} />
          <NavItem
            href="/users/notifications"
            icon={<Heart className="h-6 w-6" />}
            label="Notifications"
            active={pathname === '/notifications' || pathname === '/users/notifications'}
            badge={unreadNotifications}
          />
          <NavItem href="/create" icon={<PlusSquare className="h-6 w-6" />} label="Create" active={pathname === '/create'} />
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

        {/* Bottom More Menu Trigger */}
        <div className="mt-auto flex w-full flex-col relative">
          {/* Pop-up More Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-14 left-0 flex w-[240px] flex-col rounded-lg bg-[var(--background)] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[var(--ig-border)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.08)]">
              {/* Settings with submenu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettingsSubmenu(!showSettingsSubmenu)}
                  className={`flex w-full items-center justify-between rounded-md p-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                    isSettingsActive() ? 'text-blue-500 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${showSettingsSubmenu ? 'rotate-90' : ''}`}
                  />
                </button>

                {showSettingsSubmenu && (
                  <div className="ml-2 mt-1 flex flex-col border-l border-[var(--ig-border)] pl-2">
                    {settingsOptions.map((option) => {
                      const isActive =
                        pathname === option.href.split('?')[0] &&
                        getCurrentSection() === option.href.split('section=')[1];
                      return (
                        <Link
                          key={option.name}
                          href={option.href}
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowSettingsSubmenu(false);
                          }}
                          className={`flex items-center gap-3 rounded-md p-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                            isActive ? 'text-blue-500 font-semibold' : ''
                          }`}
                        >
                          <option.icon className="h-4 w-4" />
                          <div className="flex flex-col text-left">
                            <span>{option.name}</span>
                            <span className="text-xs text-neutral-500">{option.description}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Help Center */}
              <Link
                href="/help-center"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <LifeBuoy className="h-5 w-5" />
                Help Center
              </Link>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center justify-between rounded-md p-3 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>Switch Appearance</span>
                </div>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-md p-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                <LogOut className="h-5 w-5" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>

              {/* Premium badge */}
              <div className="mt-1 flex items-center gap-2 rounded-md border-t border-[var(--ig-border)] px-3 pt-2.5 pb-1">
                <Crown className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-500">Premium Member</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:justify-start ${
              showMoreMenu ? 'font-bold' : 'font-normal'
            }`}
          >
            <div className={`transition-transform group-hover:scale-105 ${showMoreMenu ? '*:stroke-[3px]' : ''}`}>
              <Menu className="h-6 w-6" />
            </div>
            <span className="hidden lg:block text-[15px]">More</span>
          </button>
        </div>
      </div>
    </>
  );
}

// NavItem — same hover/active pattern as the reference sidebar
const NavItem = ({
  href,
  icon,
  label,
  active = false,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
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
      <div
        className={`
        relative transition-all duration-200 ease-in-out
        group-hover:scale-105
        flex items-center justify-center
        ${active ? 'text-blue-500' : 'text-[var(--foreground)]'}
        ${!active && 'group-hover:text-blue-400'}
      `}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#fd297b] px-1 text-[10px] font-bold text-white border-2 border-[var(--background)] animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className={`
        hidden lg:block text-[15px] transition-colors duration-200 ease-in-out
        ${active ? 'text-blue-500' : 'text-[var(--foreground)]'}
        ${!active && 'group-hover:text-blue-400'}
      `}
      >
        {label}
      </span>
    </Link>
  );
};

export default Sidebar;