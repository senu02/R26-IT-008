// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { BackgroundWrapper, getTheme, animationStyles } from '@/context/theme';
import Sidebar from '@/components/Home/Sidebar';
import StoryRow from '@/components/Home/StoryRow';
import PostSection from '@/components/User/Posts/PostSection';
import RightSidebar from '@/components/Home/RightSidebar';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const theme = getTheme(isDark);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  if (!mounted) {
    return null;
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full ${theme.surface.glass} ${theme.surface.border} ${theme.surface.glassHover} transition-all duration-300`}
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* 3-Column Layout */}
      <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] font-sans relative">
        {/* Left Sidebar - Fixed Width, Hidden on Mobile */}
        <aside className="hidden md:block fixed md:relative w-[72px] lg:w-[245px] shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content Area - Centered Feed */}
        <main className="flex-1 flex justify-center min-w-0 px-4 md:px-6 py-4 md:py-6">
          <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
            {/* Stories Row */}
            <div className="mb-6">
              <StoryRow />
            </div>

            {/* Feed Posts */}
            <div className="space-y-6">
              <PostSection theme={theme} isDark={isDark} />
            </div>
          </div>
        </main>

        {/* Right Sidebar - Fixed Width, Hidden on Tablet/Mobile */}
        <aside className="hidden xl:block w-[320px] shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="py-6 pr-6">
            <RightSidebar />
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
    </BackgroundWrapper>
  );
}