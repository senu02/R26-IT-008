"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Plus, Loader2, X, Image as ImageIcon, Type, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { 
  isAuthenticated, 
  getCurrentUserData, 
  getImageUrl,
  storyApi,
  storyHelpers,
  PLACEHOLDER_AVATAR,
  type User,
  type StoryFeedItem
} from '@/app/services/Stories/actions';

type Story = StoryFeedItem;

// Custom Popup Component
interface CustomPopupProps {
  isOpen: boolean;
  type: 'confirm' | 'success' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
}

const CustomPopup: React.FC<CustomPopupProps> = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <Trash2 className="h-12 w-12 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case 'confirm':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && type !== 'confirm') {
          onClose();
        }
      }}
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-gray-900">
        {type !== 'confirm' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{getIcon()}</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
          <div className="flex w-full gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${getButtonColors()}`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${getButtonColors()}`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main StoryRow Component
const StoryRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [feedStories, setFeedStories] = useState<StoryFeedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [viewer, setViewer] = useState<StoryFeedItem | null>(null);
  const [viewerStories, setViewerStories] = useState<StoryFeedItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Popup states
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
    storyId?: number;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });
  
  // Get current user data
  useEffect(() => {
    const userData = getCurrentUserData();
    setCurrentUser(userData);
  }, []);

  const myAvatar = currentUser?.profile_picture 
    ? getImageUrl(currentUser.profile_picture) 
    : PLACEHOLDER_AVATAR;

  const fetchStories = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const stories = await storyApi.getFeed();
      setFeedStories(stories);
      
      const userData = getCurrentUserData();
      if (userData) {
        const myStoriesFiltered = storyHelpers.getUserStories(stories, userData.id);
        setMyStories(myStoriesFiltered);
      }
      
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const interval = setInterval(() => {
      fetchStories();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStories]);

  // Auto-play progress
  useEffect(() => {
    if (!viewer || isPaused) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      return;
    }

    const STORY_DURATION = 5000; // 5 seconds per story
    const UPDATE_INTERVAL = 50; // Update every 50ms for smooth progress

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (UPDATE_INTERVAL / STORY_DURATION) * 100;
        if (newProgress >= 100) {
          // Move to next story
          if (viewerIndex < viewerStories.length - 1) {
            setViewerIndex(viewerIndex + 1);
            setViewer(viewerStories[viewerIndex + 1]);
            return 0;
          } else {
            // Close viewer when all stories are done
            setViewer(null);
            setViewerStories([]);
            return 0;
          }
        }
        return newProgress;
      });
    }, UPDATE_INTERVAL);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [viewer, viewerIndex, viewerStories, isPaused]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [viewerIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [feedStories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openAddStory = () => {
    setMessage(null);
    setError(null);
    setShowAddOptions(false);
    fileInputRef.current?.click();
  };

  const uploadStory = async (file: File) => {
    if (!isAuthenticated()) {
      setMessage('Please login to add a story.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const newStory = await storyApi.upload(file);
      
      const userData = getCurrentUserData();
      
      const storyWithDetails: StoryFeedItem = {
        id: newStory.id,
        user: newStory.user,
        user_id: newStory.user_id || newStory.user,
        image: newStory.image_url || newStory.image,
        image_url: newStory.image_url || newStory.image,
        created_at: newStory.created_at,
        author_name: newStory.author_name || userData?.full_name || 'Me',
        author_avatar: newStory.author_avatar || userData?.profile_picture || null,
      };
      
      setMyStories(prev => [storyWithDetails, ...prev]);
      setFeedStories(prev => [storyWithDetails, ...prev]);
      
      setMessage('Story added successfully! 🎉');
      setTimeout(() => setMessage(null), 3000);
      
      setShowAddOptions(false);
      
    } catch (err) {
      console.error('Error uploading story:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload story.');
    } finally {
      setUploading(false);
    }
  };

  const deleteStory = async (storyId: number) => {
    if (!isAuthenticated()) return;

    try {
      setUploading(true);
      await storyApi.delete(storyId);
      
      const updatedStories = myStories.filter(s => s.id !== storyId);
      setMyStories(updatedStories);
      setFeedStories(prev => prev.filter(s => s.id !== storyId));
      
      setViewerStories(prev => prev.filter(s => s.id !== storyId));
      
      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Story deleted successfully!',
      });
      
      if (viewerStories.length <= 1) {
        setViewer(null);
      }
      
    } catch (err) {
      console.error('Error deleting story:', err);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Error!',
        message: 'Failed to delete story. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = (storyId: number) => {
    setPopup({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Story?',
      message: 'Are you sure you want to delete this story? This action cannot be undone.',
      onConfirm: () => {
        setPopup(prev => ({ ...prev, isOpen: false }));
        deleteStory(storyId);
      },
      storyId: storyId,
    });
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

    await uploadStory(file);
  };

  // Open story viewer with multiple stories
  const openStoryViewer = (stories: StoryFeedItem[], index: number = 0) => {
    setViewerStories(stories);
    setViewerIndex(index);
    setViewer(stories[index]);
    setProgress(0);
    setIsPaused(false);
  };

  // Navigate to next/previous story
  const navigateStory = (direction: 'next' | 'prev') => {
    if (!viewer) return;
    
    const newIndex = direction === 'next' 
      ? viewerIndex + 1 
      : viewerIndex - 1;
    
    if (newIndex >= 0 && newIndex < viewerStories.length) {
      setViewerIndex(newIndex);
      setViewer(viewerStories[newIndex]);
      setProgress(0);
    }
  };

  // Close popup
  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // If not authenticated
  if (!isAuthenticated()) {
    return (
      <section className="relative mb-6 w-full border-b border-[var(--ig-border)] bg-[var(--background)] pb-3 pt-1">
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-[var(--ig-muted)]">Please login to view stories</p>
        </div>
      </section>
    );
  }

  // Loading state
  if (loading && feedStories.length === 0) {
    return (
      <section className="relative mb-6 w-full border-b border-[var(--ig-border)] bg-[var(--background)] pb-3 pt-1">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--ig-muted)]" />
          <span className="ml-2 text-sm text-[var(--ig-muted)]">Loading stories...</span>
        </div>
      </section>
    );
  }

  const hasStories = myStories.length > 0;
  const userStoryGroups = storyHelpers.groupStoriesByUser(feedStories, currentUser?.id);

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

        {error && (
          <p className="mt-2 px-1 text-center text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-2 px-1 text-center text-xs text-green-600 dark:text-green-400">
            {message}
          </p>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pt-2 pb-2 pl-1 md:pl-0 scrollbar-none"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {/* Your story */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="relative h-[66px] w-[66px] shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (hasStories) {
                    openStoryViewer(myStories, 0);
                  } else {
                    setShowAddOptions(!showAddOptions);
                  }
                }}
                disabled={uploading}
                className={`flex h-[66px] w-[66px] cursor-pointer items-center justify-center rounded-full bg-[var(--background)] transition disabled:opacity-60 ${
                  hasStories
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-[2px]'
                    : 'border-2 border-dashed border-[var(--ig-border)] hover:border-[var(--ig-muted)]'
                }`}
                aria-label={hasStories ? 'View your stories' : 'Add to your story'}
              >
                <span className="relative flex h-[58px] w-[58px] overflow-hidden rounded-full bg-[var(--background)]">
                  <img 
                    src={myAvatar}
                    alt="Your profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                    }}
                  />
                </span>
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddOptions(!showAddOptions);
                }}
                disabled={uploading}
                className="absolute bottom-0 right-0 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--background)] bg-[#0095f6] text-white shadow-sm disabled:opacity-60 hover:bg-[#1877f2] transition-colors"
                aria-label={hasStories ? "Add another story" : "Add to your story"}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                )}
              </button>

              {myStories.length > 1 && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                  <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                  <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                </div>
              )}
            </div>
            
            <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
              {hasStories ? 'Your story' : 'Add story'}
            </span>
            
            {myStories.length > 1 && (
              <span className="text-[10px] text-[var(--ig-muted)] -mt-1">
                {myStories.length} stories
              </span>
            )}
          </div>

          {/* Friend stories */}
          {userStoryGroups.map(({ userId, stories }) => {
            const latestStory = stories[0];
            const hasMultiple = stories.length > 1;
            
            return (
              <button
                type="button"
                key={userId}
                onClick={() => openStoryViewer(stories, 0)}
                className="flex shrink-0 flex-col items-center gap-1.5 cursor-pointer rounded-lg p-0 text-left opacity-90 transition hover:opacity-100 relative"
              >
                <span className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-[2px] transition-transform hover:scale-[1.02]">
                  <span className="absolute inset-[2px] rounded-full bg-[var(--background)]" />
                  <img
                    src={storyHelpers.getAvatar(latestStory)}
                    alt={storyHelpers.getDisplayName(latestStory)}
                    className="relative z-10 h-full w-full rounded-full border-2 border-transparent object-cover p-[1px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                    }}
                  />
                  
                  {hasMultiple && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                      <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                      <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                      <span className="h-1 w-1 rounded-full bg-[#0095f6]"></span>
                    </div>
                  )}
                </span>
                <span className="w-[76px] truncate text-center text-xs text-[var(--foreground)]">
                  {storyHelpers.getDisplayName(latestStory)}
                </span>
              </button>
            );
          })}

          {userStoryGroups.length === 0 && !loading && (
            <div className="flex items-center justify-center py-2 px-4 text-sm text-[var(--ig-muted)]">
              No stories from friends
            </div>
          )}
        </div>

        {/* Add Story Options Popup */}
        {showAddOptions && (
          <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-[var(--ig-border)] bg-[var(--background)] shadow-lg z-20">
            <button
              type="button"
              onClick={openAddStory}
              disabled={uploading}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--ig-hover)] transition-colors rounded-t-lg disabled:opacity-50"
            >
              <ImageIcon className="h-5 w-5" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddOptions(false);
                setMessage('Text stories coming soon!');
                setTimeout(() => setMessage(null), 3000);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--ig-hover)] transition-colors rounded-b-lg border-t border-[var(--ig-border)]"
            >
              <Type className="h-5 w-5" />
              <span>Create Text Story</span>
            </button>
          </div>
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

      {/* Story Viewer Modal with Auto-play */}
      {viewer && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Story"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewer(null);
              setViewerStories([]);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') navigateStory('prev');
            if (e.key === 'ArrowRight') navigateStory('next');
            if (e.key === 'Escape') {
              setViewer(null);
              setViewerStories([]);
            }
            if (e.key === ' ') {
              e.preventDefault();
              togglePause();
            }
          }}
        >
          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-black/60 rounded-full p-4">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white bg-gradient-to-b from-black/50 to-transparent z-10">
            <div className="flex items-center gap-3">
              <img
                src={storyHelpers.getAvatar(viewer)}
                alt={storyHelpers.getDisplayName(viewer)}
                className="h-8 w-8 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                }}
              />
              <span className="text-sm font-semibold">{storyHelpers.getDisplayName(viewer)}</span>
              <span className="text-xs text-white/60">
                {new Date(viewer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewer(null);
                setViewerStories([]);
              }}
              className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Story progress bars */}
          <div className="flex justify-center gap-1 px-4 pt-2 z-10">
            {viewerStories.map((_, idx) => (
              <div
                key={idx}
                className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-100 ${
                    idx === viewerIndex ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{
                    width: idx === viewerIndex ? `${progress}%` : idx < viewerIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Image with click navigation and pause */}
          <div 
            className="flex flex-1 items-center justify-center px-4 pb-8 cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const height = rect.height;
              
              // Click on top half - pause/play
              if (y < height * 0.3) {
                togglePause();
                return;
              }
              
              // Click on bottom half - navigate
              if (viewerStories.length > 1) {
                if (x < rect.width / 2) {
                  navigateStory('prev');
                } else {
                  navigateStory('next');
                }
              }
            }}
          >
            <img
              src={storyHelpers.getStoryImage(viewer)}
              alt="Story"
              className="max-h-[min(80vh,900px)] max-w-full rounded-sm object-contain select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/800/1200';
              }}
            />
            
            {/* Navigation arrows - visible on hover */}
            {viewerStories.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity">
                {viewerIndex > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigateStory('prev'); }}
                    className="rounded-full bg-black/40 p-2 hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                )}
                {viewerIndex < viewerStories.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigateStory('next'); }}
                    className="rounded-full bg-black/40 p-2 hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delete button */}
          {(viewer.user === currentUser?.id || viewer.user_id === currentUser?.id) && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              <button
                type="button"
                onClick={() => handleDeleteConfirm(viewer.id)}
                className="rounded-full bg-red-600/90 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors backdrop-blur-sm"
              >
                Delete Story
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Popup */}
      <CustomPopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
        onCancel={closePopup}
        onClose={closePopup}
        confirmText={popup.type === 'confirm' ? 'Delete' : 'OK'}
        cancelText="Cancel"
      />
    </>
  );
};

export default StoryRow;