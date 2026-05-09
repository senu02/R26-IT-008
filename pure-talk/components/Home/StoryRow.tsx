"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Plus, Loader2, X } from 'lucide-react';

import { userAPI, getCurrentUserData, getImageUrl, User } from '@/lib/api';

// Local type definitions
type StoryItem = {
  id: number;
  user_id?: number;
  author_name: string;
  author_avatar?: string;
  image_url: string;
  created_at?: string;
};

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

const StoryRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewer, setViewer] = useState<StoryItem | null>(null);
  const [auth, setAuth] = useState(true); // Demo mode always authenticated
  const [users, setUsers] = useState<User[]>([]);
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await userAPI.getAllUsers();
        // Filter out the current user if needed, or just set all users
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Use logged-in user profile for "Your story".
  const currentUser = getCurrentUserData();
  const myAvatar = getImageUrl(currentUser?.profile_picture) || PLACEHOLDER_AVATAR;

  // Load demo stories from localStorage
  useEffect(() => {
    const savedStories = localStorage.getItem('demo_my_stories');
    if (savedStories) {
      setMyStories(JSON.parse(savedStories));
    } else {
      // Start with empty stories
      setMyStories([]);
    }
  }, []);

  // Save stories to localStorage
  const saveMyStories = (stories: StoryItem[]) => {
    localStorage.setItem('demo_my_stories', JSON.stringify(stories));
    setMyStories(stories);
  };

  const myStory = myStories.length > 0 ? myStories[0] : undefined;

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openAddStory = () => {
    setMessage(null);
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage('Image must be 8MB or smaller.');
      return;
    }

    setUploading(true);
    setMessage(null);
    
    try {
      // Convert image to base64 for demo storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const newStory: StoryItem = {
          id: Date.now(),
          user_id: currentUser?.id,
          author_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'You',
          author_avatar: myAvatar,
          image_url: reader.result as string,
          created_at: new Date().toISOString(),
        };
        
        const updatedStories = [newStory, ...myStories];
        saveMyStories(updatedStories);
        setUploading(false);
        setMessage('Story added successfully!');
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMessage('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <>
      <section
        aria-label="Stories"
        className="relative mb-6 w-full border-b border-[var(--ig-border)] bg-[var(--background)] pb-3 pt-1"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onFileChange}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pt-2 pb-2 pl-1 md:pl-0 scrollbar-none"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {/* Your story — tap ring to view (if any); + to add */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="relative h-[66px] w-[66px] shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (myStory) setViewer(myStory);
                  else openAddStory();
                }}
                disabled={uploading}
                className={`flex h-[66px] w-[66px] cursor-pointer items-center justify-center rounded-full bg-[var(--background)] transition disabled:opacity-60 ${
                  myStory
                    ? 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px]'
                    : 'border-2 border-dashed border-[var(--ig-border)] hover:border-[var(--ig-muted)]'
                }`}
                aria-label={myStory ? 'View your story' : 'Add to your story'}
              >
                <span className="relative flex h-[58px] w-[58px] overflow-hidden rounded-full bg-[var(--background)]">
                  {myStory ? (
                    <img src={myStory.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <img src={myAvatar} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddStory();
                }}
                disabled={uploading}
                className="absolute bottom-0 right-0 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--ig-link)] text-white shadow-sm disabled:opacity-60"
                aria-label="Add to your story"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                )}
              </button>
            </div>
            <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
              Your story
            </span>
          </div>

          {/* Auto imported user profiles */}
          {users.map((user, index) => {
            // Pseudo-randomly assign a story image for demo purposes
            const hasStory = index % 2 === 0;
            const storyImage = hasStory ? `https://picsum.photos/id/${10 + index}/800/1200` : undefined;
            const avatarUrl = getImageUrl(user.profile_picture) || `https://i.pravatar.cc/150?img=${(index % 70) + 1}`;
            const userName = user.full_name || user.email.split('@')[0];

            return (
              <button
                type="button"
                key={user.id}
                onClick={() => hasStory && setViewer({
                  id: user.id,
                  author_name: userName,
                  image_url: storyImage!,
                  author_avatar: avatarUrl
                })}
                disabled={!hasStory}
                title={hasStory ? `View ${userName}'s story` : `${userName} — no story yet`}
                className={`flex shrink-0 flex-col items-center gap-1.5 rounded-lg p-0 text-left transition ${
                  hasStory
                    ? 'cursor-pointer hover:opacity-90'
                    : 'cursor-default opacity-90'
                }`}
              >
                {hasStory ? (
                  <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] transition-transform hover:scale-[1.02]">
                    <span className="absolute inset-[2px] rounded-full bg-[var(--background)]" />
                    <img
                      src={avatarUrl}
                      alt=""
                      className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
                    />
                  </span>
                ) : (
                  <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--ig-border)] bg-[var(--background)] p-[2px]">
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-[58px] w-[58px] rounded-full object-cover"
                    />
                  </span>
                )}
                <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
                  {userName.split(' ')[0]}
                </span>
              </button>
            );
          })}


        </div>

        {message && (
          <p className="mt-2 px-1 text-center text-xs text-red-600 dark:text-red-400">
            {message}
          </p>
        )}

        {showLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] shadow-sm transition hover:opacity-80"
            aria-label="Scroll stories left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {showRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] shadow-sm transition hover:opacity-80"
            aria-label="Scroll stories right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>

      {viewer && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Story"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="truncate text-sm font-semibold">{viewer.author_name}</span>
            <button
              type="button"
              onClick={() => setViewer(null)}
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 pb-8">
            <img
              src={viewer.image_url}
              alt=""
              className="max-h-[min(85vh,900px)] max-w-full rounded-sm object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StoryRow;