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

  if (!mounted) {
    return null;
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      {/* Main Layout Container - Fixed height */}
      <div className="flex h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
        
        {/* Left Sidebar - Fixed */}
        <aside className="hidden md:block w-[72px] lg:w-[245px] shrink-0 h-full">
          <Sidebar />
        </aside>

        {/* Main Content - Scrollable with hidden scrollbar */}
        <main className="flex-1 flex justify-center min-w-0 px-4 md:px-6 py-4 md:py-6 overflow-y-auto h-full scrollbar-hide">
          <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
            {/* Stories Row */}
            <div className="mb-6">
              <StoryRow />
            </div>

            {/* Feed Posts */}
            <div className="space-y-6 pb-20">
              <PostSection theme={theme} isDark={isDark} />
            </div>
          </div>
        </main>

        {/* Right Sidebar - Fixed with hidden scrollbar */}
        <aside className="hidden xl:block w-[320px] shrink-0 h-full">
          <div className="h-full overflow-y-auto py-6 pr-6 scrollbar-hide">
            <RightSidebar />
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Add global scrollbar hiding styles */}
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </BackgroundWrapper>
  );
}