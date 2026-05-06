"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Settings
} from 'lucide-react';
import { getCurrentUserData, getImageUrl } from '@/lib/api';

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUserData();
    if (currentUser) {
      setUserAvatar(getImageUrl(currentUser.profile_picture) || 'https://i.pravatar.cc/150?img=11');
    }
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] transition-opacity group-hover:opacity-70">
              <span className="font-bold text-sm tracking-tight">PT</span>
            </div>
            <h1 className="font-semibold tracking-tight text-[1.35rem] text-[var(--foreground)]">
              PureTalk
            </h1>
          </Link>

          {/* Mobile Logo Collapse */}
          <Link href="/home" className="block lg:hidden group relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--ig-border)] bg-[var(--background)] transition-opacity group-hover:opacity-70">
              <span className="font-bold text-xs tracking-tight text-[var(--foreground)]">PT</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex w-full flex-col gap-2">
          <NavItem href="/home" icon={<Home className="h-6 w-6" />} label="Home" active={pathname === '/home'} />
          <NavItem href="#" icon={<Search className="h-6 w-6" />} label="Search" />
          <NavItem href="#" icon={<Compass className="h-6 w-6" />} label="Explore" />
          <NavItem href="#" icon={<MessageCircle className="h-6 w-6" />} label="Messages" />
          <NavItem href="#" icon={<Heart className="h-6 w-6" />} label="Notifications" />
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
    </>
  );
};

const NavItem = ({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) => {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:justify-start ${active ? 'font-bold' : 'font-normal'}`}
    >
      <div className={`transition-transform group-hover:scale-105 ${active ? '*:stroke-[3px]' : ''}`}>
        {icon}
      </div>
      <span className="hidden lg:block text-[15px]">{label}</span>
    </Link>
  );
};

export default Sidebar;
