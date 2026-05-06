"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';

interface SuggestedUser {
  id: number;
  user: string;
  name: string;
  subText: string;
  image: string;
}

const initialSuggestions: SuggestedUser[] = [
  { id: 1, user: 'alex_beats', name: 'Alex Johnson', subText: 'Followed by sarah_j + 2 more', image: 'https://i.pravatar.cc/150?img=12' },
  { id: 2, user: 'creative_mind', name: 'Emma Wilson', subText: 'New to PureTalk', image: 'https://i.pravatar.cc/150?img=32' },
  { id: 3, user: 'photog_expert', name: 'Chris Evans', subText: 'Suggested for you', image: 'https://i.pravatar.cc/150?img=52' },
  { id: 4, user: 'travel_diary', name: 'Olivia Brown', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=42' },
  { id: 5, user: 'foodie_lover', name: 'Liam Garcia', subText: 'Followed by john_doe', image: 'https://i.pravatar.cc/150?img=11' },
];

const DiscoverPeopleCarousel = () => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>(initialSuggestions);
  const [followedState, setFollowedState] = useState<Record<number, boolean>>({});

  const removeSuggestion = (id: number) => {
    setSuggestions((prev) => prev.filter((user) => user.id !== id));
  };

  const toggleFollow = (id: number) => {
    setFollowedState((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full py-4 my-2 border-y border-[var(--ig-border)]">
      <div className="flex justify-between items-center px-4 mb-4">
        <h2 className="font-semibold text-[var(--foreground)]">Discover People</h2>
        <Link href="/add-friends" className="text-sm font-semibold text-[var(--ig-link)] hover:text-opacity-80 transition">
          See All
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <AnimatePresence>
          {suggestions.map((user) => {
            const isFollowed = followedState[user.id];
            
            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, width: 0, marginRight: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex flex-col items-center min-w-[160px] max-w-[160px] p-4 bg-[var(--background)] border border-[var(--ig-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow snap-start shrink-0 group"
              >
                {/* Close Button */}
                <button
                  onClick={() => removeSuggestion(user.id)}
                  className="absolute top-2 right-2 p-1 text-[var(--ig-muted)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--ig-border)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>

                {/* Avatar */}
                <Link href="/users/user-profile" className="relative mb-3 block">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#ff4d6d] transition-all duration-300">
                    <img src={user.image} alt={user.user} className="w-full h-full object-cover" />
                  </div>
                  {!isFollowed && (
                    <div className="absolute -bottom-1 -right-1 bg-[#ff4d6d] text-white p-1 rounded-full border-2 border-[var(--background)]">
                      <UserPlus size={12} />
                    </div>
                  )}
                </Link>

                {/* User Info */}
                <Link href="/users/user-profile" className="font-semibold text-[var(--foreground)] text-sm truncate w-full text-center hover:underline">
                  {user.user}
                </Link>
                <span className="text-xs text-[var(--ig-muted)] text-center h-8 line-clamp-2 mt-1 mb-3">
                  {user.subText}
                </span>

                {/* Follow Button */}
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`w-full py-1.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                    isFollowed
                      ? 'bg-[var(--ig-border)] text-[var(--foreground)] hover:bg-[var(--ig-muted)]'
                      : 'bg-[#ff4d6d] text-white hover:bg-[#ff3355]'
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <Check size={16} /> Following
                    </>
                  ) : (
                    'Follow'
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DiscoverPeopleCarousel;
