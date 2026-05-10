// app/user/posts/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PostSection from '@/components/User/Posts/PostSection';
import { getTheme, type ThemeColors } from '@/context/theme';

export default function PostsPage() {
  const [isDark, setIsDark] = useState(true);
  const [theme, setTheme] = useState<ThemeColors>(getTheme(true));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    setTheme(getTheme(isDarkMode));
    setMounted(true);
  }, []);

  // Listen for theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('theme');
      const isDarkMode = savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
      setTheme(getTheme(isDarkMode));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
            Posts
          </h1>
          <p className={theme.text.muted}>
            Share your thoughts, connect with others, and discover amazing content
          </p>
        </div>

        {/* Main Post Section */}
        <PostSection theme={theme} isDark={isDark} />
      </div>
    </div>
  );
}