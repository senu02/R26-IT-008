"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUserData, getImageUrl, type User } from '@/lib/api';
import { useEffect } from 'react';

const mockSuggestions = [
  { id: 1, user: 'alex.anyways18', subText: 'Suggested for you', image: 'https://i.pravatar.cc/150?img=33' },
  { id: 2, user: 'chantouflowergirl', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=61' },
  { id: 3, user: 'gwangurl77', subText: 'Followed by chantouflower...', image: 'https://i.pravatar.cc/150?img=42' },
  { id: 4, user: 'mishka_songs', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=20' },
  { id: 5, user: 'pierre_thecomet', subText: 'Followed by mishka_songs + 6 more', image: 'https://i.pravatar.cc/150?img=17' },
];

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUserData());
  }, []);

  const profileImageUrl = getImageUrl(user?.profile_picture) || 'https://i.pravatar.cc/150?img=11';
  const displayUsername = user?.email?.split('@')[0] || 'azevedo_drdr';
  const displayName = user?.full_name || 'Azevedo';

  const toggleFollow = (id: number) => {
    setFollowingMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const removeSuggestion = (id: number) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="flex w-full max-w-[320px] flex-col text-sm text-[var(--foreground)]">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/users/user-profile" className="flex min-w-0 cursor-pointer items-center gap-3 group">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-transparent group-hover:border-[#ff4d6d] transition-colors duration-300">
            <img src={profileImageUrl} alt={displayUsername} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col text-sm">
            <span className="truncate font-semibold group-hover:opacity-80 transition-opacity">{displayUsername}</span>
            <span className="truncate text-[var(--ig-muted)]">{displayName}</span>
          </div>
        </Link>
        <button type="button" className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:text-[#ff4d6d] transition-colors">
          Switch
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-[var(--ig-muted)]">Suggested for you</span>
        <Link href="/add-friends" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity">
          See all
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {suggestions.map((suggestion) => {
            const isFollowing = followingMap[suggestion.id];
            return (
              <motion.div 
                key={suggestion.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="flex items-center justify-between gap-2 group/card"
              >
                <Link href="/users/user-profile" className="flex min-w-0 cursor-pointer items-center gap-3 relative group/link">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--ig-border)] group-hover/link:scale-105 transition-transform duration-300">
                    <img src={suggestion.image} alt={suggestion.user} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate text-sm font-semibold group-hover/link:opacity-70 transition-opacity">{suggestion.user}</span>
                    <span className="w-full max-w-[170px] truncate text-xs text-[var(--ig-muted)]">{suggestion.subText}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => toggleFollow(suggestion.id)}
                    className={`shrink-0 text-xs font-semibold transition-colors duration-300 ${
                      isFollowing ? 'text-[var(--foreground)] hover:opacity-70' : 'text-[var(--ig-link)] hover:text-[#ff4d6d]'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    onClick={() => removeSuggestion(suggestion.id)}
                    className="opacity-0 group-hover/card:opacity-100 text-[var(--ig-muted)] hover:text-[var(--foreground)] transition-all"
                    aria-label="Remove suggestion"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {suggestions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-xs text-[var(--ig-muted)] text-center py-4"
          >
            No more suggestions.
          </motion.div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 text-xs font-normal text-[var(--ig-muted)]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language'].map((item) => (
            <a key={item} href="#" className="hover:underline transition-all">
              {item}
            </a>
          ))}
        </div>
        <span className="uppercase tracking-wide">© {new Date().getFullYear()} PureTalk</span>
      </div>
    </div>
  );
};

export default RightSidebar;
