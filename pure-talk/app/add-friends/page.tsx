"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/Home/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, UserPlus } from 'lucide-react';
import Link from 'next/link';

const initialRequests = [
  { id: 101, user: 'david_smith', name: 'David Smith', mutual: '12 mutual friends', image: 'https://i.pravatar.cc/150?img=15' },
  { id: 102, user: 'sarah_jones', name: 'Sarah Jones', mutual: '3 mutual friends', image: 'https://i.pravatar.cc/150?img=47' },
];

const initialSuggestions = [
  { id: 1, user: 'alex_beats', name: 'Alex Johnson', subText: 'Followed by sarah_j + 2 more', image: 'https://i.pravatar.cc/150?img=12' },
  { id: 2, user: 'creative_mind', name: 'Emma Wilson', subText: 'New to PureTalk', image: 'https://i.pravatar.cc/150?img=32' },
  { id: 3, user: 'photog_expert', name: 'Chris Evans', subText: 'Suggested for you', image: 'https://i.pravatar.cc/150?img=52' },
  { id: 4, user: 'travel_diary', name: 'Olivia Brown', subText: 'Follows you', image: 'https://i.pravatar.cc/150?img=42' },
  { id: 5, user: 'foodie_lover', name: 'Liam Garcia', subText: 'Followed by john_doe', image: 'https://i.pravatar.cc/150?img=11' },
  { id: 6, user: 'tech_guru', name: 'Tech Guru', subText: 'Suggested for you', image: 'https://i.pravatar.cc/150?img=60' },
  { id: 7, user: 'fitness_freak', name: 'Jake Paul', subText: 'Followed by travel_diary', image: 'https://i.pravatar.cc/150?img=59' },
  { id: 8, user: 'art_lover', name: 'Mia Wong', subText: 'New to PureTalk', image: 'https://i.pravatar.cc/150?img=44' },
];

export default function AddFriendsPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [followedState, setFollowedState] = useState<Record<number, boolean>>({});

  const handleAccept = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleDecline = (id: number) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const toggleFollow = (id: number) => {
    setFollowedState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const removeSuggestion = (id: number) => {
    setSuggestions(prev => prev.filter(user => user.id !== id));
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative">
      <Sidebar />

      <main className="flex w-full flex-1 justify-center pb-16 pt-8 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[800px] flex-col px-4 md:px-8">
          
          <h1 className="text-2xl font-bold mb-8">Discover People</h1>

          {/* Friend Requests Section */}
          {requests.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 border-b border-[var(--ig-border)] pb-2">Friend Requests ({requests.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {requests.map((req) => (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="flex items-center gap-4 p-4 bg-[var(--background)] border border-[var(--ig-border)] rounded-xl shadow-sm"
                    >
                      <Link href="/users/user-profile" className="shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--ig-border)]">
                          <img src={req.image} alt={req.user} className="w-full h-full object-cover" />
                        </div>
                      </Link>
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <Link href="/users/user-profile" className="font-semibold text-sm truncate hover:underline">
                          {req.name}
                        </Link>
                        <span className="text-xs text-[var(--ig-muted)] truncate mb-2">{req.mutual}</span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req.id)}
                            className="flex-1 bg-[#ff4d6d] text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-[#ff3355] transition-colors flex items-center justify-center gap-1"
                          >
                            <Check size={16} /> Confirm
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            className="flex-1 bg-[var(--ig-border)] text-[var(--foreground)] py-1.5 rounded-lg text-sm font-semibold hover:bg-[var(--ig-muted)] transition-colors flex items-center justify-center"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Suggested Friends Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b border-[var(--ig-border)] pb-2">Suggested for You</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {suggestions.map((user) => {
                  const isFollowed = followedState[user.id];
                  
                  return (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                      className="relative flex flex-col items-center p-4 bg-[var(--background)] border border-[var(--ig-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <button
                        onClick={() => removeSuggestion(user.id)}
                        className="absolute top-2 right-2 p-1 text-[var(--ig-muted)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--ig-border)] transition-colors opacity-0 group-hover:opacity-100 z-10"
                      >
                        <X size={16} />
                      </button>

                      <Link href="/users/user-profile" className="relative mb-3 block">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#ff4d6d] transition-all duration-300">
                          <img src={user.image} alt={user.user} className="w-full h-full object-cover" />
                        </div>
                        {!isFollowed && (
                          <div className="absolute -bottom-1 -right-1 bg-[#ff4d6d] text-white p-1.5 rounded-full border-2 border-[var(--background)] shadow-sm">
                            <UserPlus size={14} />
                          </div>
                        )}
                      </Link>

                      <Link href="/users/user-profile" className="font-semibold text-[var(--foreground)] text-sm truncate w-full text-center hover:underline">
                        {user.name}
                      </Link>
                      <span className="text-xs text-[var(--ig-muted)] text-center h-8 line-clamp-2 mt-1 mb-4 w-full">
                        {user.subText}
                      </span>

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
              
              {suggestions.length === 0 && (
                <div className="col-span-full py-12 text-center text-[var(--ig-muted)]">
                  You've reviewed all suggestions.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
