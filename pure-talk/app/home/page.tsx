// app/home/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BackgroundWrapper, getTheme, animationStyles } from '@/context/theme';
import Sidebar from '@/components/User/Sidebar';
import StoryRow from '@/components/Home/StoryRow';
import PostSection from '@/components/User/Posts/PostSection';
import RightSidebar from '@/components/Home/RightSidebar';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
            
            {/* --- TOP SEARCH BAR --- */}
            <div className="mb-6">
              <div 
                className={`relative flex items-center w-full rounded-2xl transition-all duration-300 backdrop-blur-2xl border ${
                  isSearchFocused 
                    ? 'bg-black/80 border-red-500/60 ring-2 ring-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.2)]' 
                    : 'bg-[#1a1a1a]/90 border-white/10 hover:border-red-500/40 shadow-xl'
                }`}
              >
                {/* Search Icon */}
                <div className="pl-4 text-white/50 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 transition-colors duration-300 ${isSearchFocused ? 'text-red-500' : 'text-white/40'}`} />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search posts, topics, or people..."
                  className="w-full py-3.5 pl-3 pr-10 text-sm bg-transparent text-white placeholder:text-white/40 focus:outline-none tracking-wide font-sans"
                />

                {/* Clear Button */}
                {searchQuery && (
                  <div className="absolute right-3 flex items-center">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Active Search Filter Badge Indicator */}
              {searchQuery && (
                <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    Filtering feed for: <span className="text-rose-400 font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">&ldquo;{searchQuery}&rdquo;</span>
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Stories Row */}
            <div className="mb-6">
              <StoryRow />
            </div>

            {/* Feed Posts */}
            <div className="space-y-6 pb-20">
              <PostSection theme={theme} isDark={isDark} searchQuery={searchQuery} />
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