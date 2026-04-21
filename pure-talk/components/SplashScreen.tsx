'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircleHeart } from 'lucide-react';

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out after 2 seconds
    const timer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Completely remove from DOM after fade out completes (2.5s total)
    const removeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#111111] transition-opacity duration-500 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Ripple 1 */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-[#fd297b] via-[#ff655b] to-[#ff5864] animate-ripple" />
        
        {/* Ripple 2 */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-[#fd297b] via-[#ff655b] to-[#ff5864] animate-ripple delay-700" />

        {/* Logo Container */}
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#fd297b] via-[#ff655b] to-[#ff5864] flex items-center justify-center shadow-2xl shadow-pink-500/40 animate-heartbeat">
          <MessageCircleHeart className="w-16 h-16 text-white" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
