"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Plus, Loader2, X } from 'lucide-react';
import {
  storyAPI,
  friendsAPI,
  getCurrentUserData,
  getImageUrl,
  isAuthenticated,
  type StoryFeedItem,
  type FriendListItem,
} from '@/lib/api';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

/** Demo strip when not logged in */
const demoStories = [
  { id: 1, user: 'chchoitoi', image: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, user: 'gwangurl77', image: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, user: 'mishka_so...', image: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, user: 'clubsodab...', image: 'https://i.pravatar.cc/150?img=4' },
];

function friendLabel(detail: FriendListItem['friend_detail']): string {
  const name = detail.full_name?.trim();
  if (name) return name;
  const dn = (detail as { display_name?: string }).display_name?.trim();
  if (dn) return dn;
  return detail.email.split('@')[0];
}

const StoryRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [feed, setFeed] = useState<StoryFeedItem[]>([]);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewer, setViewer] = useState<StoryFeedItem | null>(null);

  const auth = isAuthenticated();
  const currentUser = getCurrentUserData();
  const myAvatar =
    getImageUrl(currentUser?.profile_picture ?? undefined) ?? PLACEHOLDER_AVATAR;

  const loadFeedAndFriends = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    setMessage(null);
    try {
      const [feedData, friendsRes] = await Promise.all([
        storyAPI.feed(),
        friendsAPI.list(),
      ]);
      setFeed(feedData);
      setFriends(friendsRes.results ?? []);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err.message ?? 'Could not load stories or friends.');
      setFeed([]);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    loadFeedAndFriends();
  }, [loadFeedAndFriends]);

  const storyByUserId = useMemo(() => {
    const m = new Map<number, StoryFeedItem>();
    for (const s of feed) {
      if (currentUser && s.user_id === currentUser.id) continue;
      m.set(s.user_id, s);
    }
    return m;
  }, [feed, currentUser]);

  /** Friends with a 24h story not already listed as friends (edge cases) */
  const orphanStories = useMemo(() => {
    const ids = new Set(friends.map((f) => f.friend));
    return feed.filter(
      (s) =>
        (!currentUser || s.user_id !== currentUser.id) && !ids.has(s.user_id)
    );
  }, [feed, friends, currentUser]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [friends, feed, auth]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const myStory =
    auth && currentUser ? feed.find((s) => s.user_id === currentUser.id) : undefined;

  const openAddStory = () => {
    setMessage(null);
    if (!auth) {
      setMessage('Log in to add a story.');
      return;
    }
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !auth) return;

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
      await storyAPI.create(file);
      await loadFeedAndFriends();
    } catch (err: unknown) {
      const er = err as { message?: string };
      setMessage(er.message ?? 'Upload failed.');
    } finally {
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
                disabled={uploading || !auth}
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

          {!auth &&
            demoStories.map((story) => (
              <button
                type="button"
                key={story.id}
                className="flex shrink-0 flex-col items-center gap-1.5 cursor-pointer rounded-lg p-0 text-left opacity-90 transition hover:opacity-100"
              >
                <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] transition-transform hover:scale-[1.02]">
                  <span className="absolute inset-[2px] rounded-full bg-[var(--background)]" />
                  <img
                    src={story.image}
                    alt=""
                    className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
                  />
                </span>
                <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
                  {story.user}
                </span>
              </button>
            ))}

          {auth && loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-[var(--ig-muted)]">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              Loading friends & stories…
            </div>
          )}

          {auth &&
            !loading &&
            friends.map((row) => {
              const story = storyByUserId.get(row.friend);
              const detail = row.friend_detail;
              const label = friendLabel(detail);
              const avatar =
                getImageUrl(detail.profile_picture ?? undefined) ?? PLACEHOLDER_AVATAR;

              return (
                <button
                  type="button"
                  key={row.friend}
                  onClick={() => story && setViewer(story)}
                  disabled={!story}
                  title={story ? `View ${label}'s story` : `${label} — no story yet`}
                  className={`flex shrink-0 flex-col items-center gap-1.5 rounded-lg p-0 text-left transition ${
                    story
                      ? 'cursor-pointer hover:opacity-90'
                      : 'cursor-default opacity-90'
                  }`}
                >
                  {story ? (
                    <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] transition-transform hover:scale-[1.02]">
                      <span className="absolute inset-[2px] rounded-full bg-[var(--background)]" />
                      <img
                        src={story.author_avatar ?? story.image_url}
                        alt=""
                        className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
                      />
                    </span>
                  ) : (
                    <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--ig-border)] bg-[var(--background)] p-[2px]">
                      <img
                        src={avatar}
                        alt=""
                        className="h-[58px] w-[58px] rounded-full object-cover"
                      />
                    </span>
                  )}
                  <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
                    {label}
                  </span>
                </button>
              );
            })}

          {auth &&
            !loading &&
            orphanStories.map((story) => (
              <button
                type="button"
                key={`orphan-${story.user_id}-${story.id}`}
                onClick={() => setViewer(story)}
                className="flex shrink-0 flex-col items-center gap-1.5 cursor-pointer rounded-lg p-0 text-left transition hover:opacity-90"
              >
                <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] transition-transform hover:scale-[1.02]">
                  <span className="absolute inset-[2px] rounded-full bg-[var(--background)]" />
                  <img
                    src={story.author_avatar ?? story.image_url}
                    alt=""
                    className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
                  />
                </span>
                <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
                  {story.author_name}
                </span>
              </button>
            ))}
        </div>

        {auth && !loading && friends.length === 0 && (
          <p className="mt-2 px-1 text-center text-xs text-[var(--ig-muted)]">
            Add friends to see them here when they share stories.
          </p>
        )}

        {message && (
          <p className="mt-2 px-1 text-center text-xs text-red-600 dark:text-red-400">
            {message}
            {!auth && (
              <>
                {' '}
                <Link href="/auth/login" className="font-semibold text-[var(--ig-link)] underline">
                  Log in
                </Link>
              </>
            )}
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
