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

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div 
        className="fixed left-0 top-0 z-50 flex h-screen w-[72px] shrink-0 flex-col overflow-y-auto border-r border-[#fd297b]/20 bg-white text-black dark:bg-gradient-to-b dark:from-[#fd297b] dark:to-[#ff655b] dark:text-white dark:border-white/20 lg:w-[245px] lg:items-start xl:w-[245px] transition-colors duration-300"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        
        {/* Advanced Logo Area */}
        <div className="mb-10 mt-2 flex w-full items-center justify-center lg:justify-start lg:pl-3">
          
          {/* Desktop Logo */}
          <Link href="/home" className="hidden lg:flex items-center gap-2 group cursor-pointer relative">
            {/* Custom Glowing App Icon */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-gradient-to-br from-[#fd297b] to-[#ff655b] text-white shadow-lg shadow-[#fd297b]/40 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
               <span className="font-bold text-sm tracking-tighter">PT</span>
            </div>
            
            {/* Gradient Typography */}
            <h1 className="text-[1.65rem] font-extrabold tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-[#fd297b] to-[#ff655b] bg-clip-text text-transparent transition-opacity duration-300 group-hover:opacity-80">Pure</span>
              <span className="text-neutral-900 dark:text-white transition-colors duration-300">Talk</span>
            </h1>
            
            {/* Ambient Background Glow Effect */}
            <div className="absolute -inset-4 rounded-full bg-[#fd297b]/15 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
          </Link>

          {/* Mobile Logo Collapse */}
          <Link href="/home" className="block lg:hidden group relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-tr from-[#fd297b] via-[#ff655b] to-[#f09433] p-[2px] shadow-lg shadow-[#fd297b]/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
               <div className="flex h-full w-full items-center justify-center rounded-[1.10rem] bg-white dark:bg-black/20 backdrop-blur-md">
                  <span className="font-extrabold text-sm bg-gradient-to-br from-[#fd297b] to-[#f09433] bg-clip-text text-transparent">PT</span>
               </div>
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
            icon={<div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden"><img src="https://i.pravatar.cc/150?img=11" alt="profile" className="h-full w-full object-cover" /></div>} 
            label="Profile" 
            active={pathname === '/users/user-profile'}
          />
        </div>

        {/* Bottom More Menu Trigger */}
        <div className="mt-auto flex w-full flex-col relative">
          
          {/* Pop-up More Menu */}
          {showMoreMenu && (
            <div className="absolute bottom-14 left-0 flex w-[220px] flex-col rounded-xl bg-white dark:bg-gradient-to-b dark:from-[#fd297b] dark:to-[#ff655b] p-2 shadow-xl border border-neutral-100 dark:border-white/20">
              <Link href="/users/user-settings" className="flex items-center gap-3 rounded-lg p-3 hover:bg-black hover:text-white text-sm">
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-between w-full rounded-lg p-3 hover:bg-black hover:text-white text-sm"
              >
                <div className="flex items-center gap-3">
                  {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>Switch Appearance</span>
                </div>
              </button>
            </div>
          )}

          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black hover:text-white lg:justify-start ${showMoreMenu ? 'font-bold text-[#fd297b]' : 'font-normal hover:text-white dark:hover:text-white'}`}
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
      className={`group flex items-center justify-center gap-4 rounded-lg p-3 transition-colors hover:bg-black hover:text-white lg:justify-start ${active ? 'font-bold text-[#fd297b]' : 'font-normal hover:text-white dark:hover:text-white'}`}
    >
      <div className={`transition-transform group-hover:scale-105 ${active ? '*:stroke-[3px]' : ''}`}>
        {icon}
      </div>
      <span className="hidden lg:block text-[15px]">{label}</span>
    </Link>
  );
};

export default Sidebar;
