'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FaHeart, 
  FaComment, 
  FaShare, 
  FaMusic, 
  FaPlay, 
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaPlus,
  FaCamera
} from 'react-icons/fa';
import { ThemeColors, getTheme } from '@/context/theme';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';
import CreateReelModal from '@/components/User/Reels/CreateReelModal';
import { videoActions, getFullMediaUrl } from '@/app/services/videos/actions';
import { useToast } from '@/context/toast';

interface HomePageProps {
  isDarkMode?: boolean;
  theme?: ThemeColors;
}

interface ReelVideo {
  id: number;
  videoUrl: string;
  username: string;
  userAvatar: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  music: string;
  user_id: number;
  user_full_name: string;
  user_email: string;
  video_file: string;
  thumbnail_url: string | null;
  allow_comments: boolean;
  allow_sharing: boolean;
  is_blocked: boolean;
  is_flagged: boolean;
  created_at: string;
}

export default function HomePage({ isDarkMode = true, theme: customTheme }: HomePageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<ReelVideo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDark, setIsDark] = useState(isDarkMode);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = customTheme || getTheme(isDark);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await videoActions.getVideos({
        page: 1,
        page_size: 30,
      });
      
      if (result.success && result.data) {
        const videos = result.data as any[];
        
        const transformedReels: ReelVideo[] = videos
          .filter((v: any) => !v.is_blocked)
          .map((v: any) => {
            const userData = v.user_details || {};
            const videoUrl = getFullMediaUrl(v.video_url || v.video_file) || '';
            
            let userAvatar: string;
            if (userData.profile_picture) {
              userAvatar = getFullMediaUrl(userData.profile_picture) || '';
            } else {
              const name = userData.full_name || userData.email?.split('@')[0] || 'User';
              userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&length=2&bold=true`;
            }
            
            const thumbnailUrl = getFullMediaUrl(v.thumbnail_url || v.thumbnail);
            
            return {
              id: v.id,
              videoUrl: videoUrl,
              username: userData.full_name || userData.email?.split('@')[0] || 'User',
              userAvatar: userAvatar,
              caption: v.description || v.title || '',
              likes: v.likes_count || 0,
              comments: v.comments_count || 0,
              shares: v.shares_count || 0,
              isLiked: v.is_liked || false,
              music: v.music_title || 'Original Sound',
              user_id: userData.id || v.user,
              user_full_name: userData.full_name || '',
              user_email: userData.email || '',
              video_file: v.video_file || '',
              thumbnail_url: thumbnailUrl,
              allow_comments: v.allow_comments !== false,
              allow_sharing: v.allow_sharing !== false,
              is_blocked: v.is_blocked || false,
              is_flagged: v.is_flagged || false,
              created_at: v.created_at || new Date().toISOString(),
            };
          });
        
        setReels(transformedReels);
        
        if (transformedReels.length === 0) {
          setError('No reels available right now. Check back later!');
        }
      } else {
        setError(result.error || 'Failed to load reels');
        showError(result.error || 'Failed to load reels');
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
      setError('Failed to load reels. Please try again.');
      showError('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleReelCreated = () => {
    fetchReels();
  };

  const toggleRightSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const itemHeight = window.innerHeight;
        const index = Math.round(scrollTop / itemHeight);
        if (index !== activeIndex && index < reels.length) {
          setActiveIndex(index);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [reels.length]);

  useEffect(() => {
    if (videoRef.current && reels.length > 0) {
      const video = videoRef.current;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [activeIndex, reels.length]);

  const handleLike = async () => {
    if (!reels[activeIndex]) return;
    
    const reel = reels[activeIndex];
    const newLikedState = !reel.isLiked;
    
    const updatedReels = [...reels];
    updatedReels[activeIndex] = {
      ...reel,
      isLiked: newLikedState,
      likes: newLikedState ? reel.likes + 1 : reel.likes - 1,
    };
    setReels(updatedReels);
    
    try {
      const result = await videoActions.toggleLike(reel.id);
      if (!result.success) {
        const revertReels = [...reels];
        revertReels[activeIndex] = {
          ...reel,
          isLiked: reel.isLiked,
          likes: reel.likes,
        };
        setReels(revertReels);
        showError(result.error || 'Failed to like video');
      }
    } catch (error) {
      const revertReels = [...reels];
      revertReels[activeIndex] = {
        ...reel,
        isLiked: reel.isLiked,
        likes: reel.likes,
      };
      setReels(revertReels);
      showError('Failed to like video');
    }
  };

  const handleShare = async () => {
    if (!reels[activeIndex]) return;
    
    const reel = reels[activeIndex];
    try {
      const result = await videoActions.shareVideo(reel.id);
      if (result.success) {
        const updatedReels = [...reels];
        updatedReels[activeIndex] = {
          ...reel,
          shares: reel.shares + 1,
        };
        setReels(updatedReels);
        showSuccess('Video shared successfully!');
        
        if (navigator.share) {
          try {
            await navigator.share({
              title: reel.caption || reel.username,
              text: `Check out this reel by ${reel.username}!`,
              url: window.location.href,
            });
          } catch (shareError) {}
        } else {
          await navigator.clipboard.writeText(window.location.href);
          showSuccess('Link copied to clipboard!');
        }
      } else {
        showError(result.error || 'Failed to share video');
      }
    } catch (error) {
      showError('Failed to share video');
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVideoEnd = () => {
    if (activeIndex < reels.length - 1) {
      const container = containerRef.current;
      if (container) {
        const nextIndex = activeIndex + 1;
        const scrollTo = nextIndex * window.innerHeight;
        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        setActiveIndex(nextIndex);
      }
    } else {
      const container = containerRef.current;
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveIndex(0);
      }
    }
  };

  const getBackgroundClass = () => {
    if (isDark) {
      return 'bg-black';
    }
    return 'bg-gradient-to-br from-[#f0f5ff] via-[#e4efff] to-[#f0f8ff]';
  };

  const getTextClass = (type: keyof ThemeColors['text'] = 'primary') => {
    return theme.text[type];
  };

  const generateStarStyles = () => {
    if (!isMounted) return [];
    
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        width: Math.random() * 2.5 + 0.5,
        height: Math.random() * 2.5 + 0.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        animationDelay: Math.random() * 5,
        animationDuration: Math.random() * 3 + 2,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    return stars;
  };

  const generateBrightStarStyles = () => {
    if (!isMounted) return [];
    
    const stars = [];
    for (let i = 0; i < 20; i++) {
      stars.push({
        width: Math.random() * 4 + 1.5,
        height: Math.random() * 4 + 1.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        animationDelay: Math.random() * 8,
        animationDuration: Math.random() * 4 + 2,
        opacity: Math.random() * 0.6 + 0.3,
        boxShadow: `0 0 ${Math.random() * 8 + 3}px rgba(255,255,255,0.6)`,
      });
    }
    return stars;
  };

  const renderStars = () => {
    if (!isMounted) return null;
    
    const starStyles = generateStarStyles();
    const brightStarStyles = generateBrightStarStyles();
    
    return (
      <>
        {starStyles.map((style, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: `${style.width}px`,
              height: `${style.height}px`,
              top: `${style.top}%`,
              left: `${style.left}%`,
              animationDelay: `${style.animationDelay}s`,
              animationDuration: `${style.animationDuration}s`,
              opacity: style.opacity,
            }}
          />
        ))}
        {brightStarStyles.map((style, i) => (
          <div
            key={`bright-${i}`}
            className="absolute rounded-full bg-white animate-pulse-glow"
            style={{
              width: `${style.width}px`,
              height: `${style.height}px`,
              top: `${style.top}%`,
              left: `${style.left}%`,
              animationDelay: `${style.animationDelay}s`,
              animationDuration: `${style.animationDuration}s`,
              opacity: style.opacity,
              boxShadow: style.boxShadow,
            }}
          />
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <main className={`relative h-screen overflow-hidden ${getBackgroundClass()}`}>
        <Sidebar />
        <div className="hidden xl:block fixed right-0 top-0 h-screen w-[320px] z-40">
          <RightSidebar />
        </div>
        <div className="flex items-center justify-center h-screen ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={getTextClass('secondary')}>Loading reels...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && reels.length === 0) {
    return (
      <main className={`relative h-screen overflow-hidden ${getBackgroundClass()}`}>
        <Sidebar />
        <div className="hidden xl:block fixed right-0 top-0 h-screen w-[320px] z-40">
          <RightSidebar />
        </div>
        <div className="flex items-center justify-center h-screen ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className={`text-2xl font-bold mb-2 ${getTextClass()}`}>No Reels Found</h2>
            <p className={`${getTextClass('secondary')} mb-4`}>{error}</p>
            <button
              onClick={fetchReels}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative h-screen overflow-hidden ${getBackgroundClass()}`}>
      <Sidebar />

      <div className="hidden xl:block fixed right-0 top-0 h-screen w-[320px] z-40">
        <RightSidebar />
      </div>

      <button
        onClick={toggleRightSidebar}
        className="xl:hidden fixed right-4 bottom-20 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {isDark && isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          {renderStars()}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-indigo-500/3 blur-3xl animate-pulse-slow delay-2000"></div>
        </div>
      )}

      {isDark && !isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-indigo-500/3 blur-3xl"></div>
        </div>
      )}

      <header className={`fixed top-0 left-[72px] lg:left-[245px] right-0 xl:right-[320px] z-50 flex justify-between items-center px-4 py-3 ${
        isDark ? 'bg-gradient-to-b from-black/60 to-transparent' : 'bg-gradient-to-b from-white/60 to-transparent'
      }`}>
        <div className="flex items-center gap-2">
          <FaCamera className="text-2xl text-indigo-500" />
          <h1 className={`text-2xl font-bold ${getTextClass()}`}>Reels</h1>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-sm font-semibold text-white hover:scale-105 transition-transform"
        >
          + Create
        </button>
      </header>

      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll scrollbar-hide snap-y snap-mandatory relative ml-[72px] lg:ml-[245px] xl:mr-[320px]"
      >
        {reels.map((reel, idx) => (
          <div
            key={`${reel.id}-${idx}`}
            className="relative w-full h-screen snap-start flex items-center justify-center"
          >
            <video
              ref={idx === activeIndex ? videoRef : null}
              src={reel.videoUrl}
              className="w-full h-full object-cover"
              loop={false}
              muted={isMuted}
              playsInline
              onClick={handlePlayPause}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnd}
              poster={reel.thumbnail_url || undefined}
            />

            {!isPlaying && idx === activeIndex && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-black/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaPlay className={`text-4xl ${isDark ? 'text-white' : 'text-gray-800'}`} />
                </div>
              </div>
            )}

            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-t from-black/80 via-transparent to-black/20' 
                : 'bg-gradient-to-t from-gray-900/40 via-transparent to-gray-900/10'
            } pointer-events-none`} />

            {idx === activeIndex && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 z-10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className={`absolute bottom-32 left-4 right-24 flex flex-col gap-3 z-10 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  src={reel.userAvatar}
                  alt={reel.username}
                  className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                />
                <h3 className={`font-bold text-lg ${getTextClass()}`}>@{reel.username}</h3>
                <button className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-sm font-semibold text-white hover:scale-105 transition-transform">
                  Follow
                </button>
              </div>

              <p className={`text-sm ${getTextClass('secondary')}`}>{reel.caption}</p>

              {reel.music && (
                <div className={`flex items-center gap-2 text-sm ${theme.text.muted}`}>
                  <FaMusic className="text-xs" />
                  <span>{reel.music}</span>
                </div>
              )}
            </div>

            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500">
                <img
                  src={reel.userAvatar}
                  alt={reel.username}
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/30 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/50' : 'hover:bg-white/50'} transition-colors`}>
                  <FaHeart
                    className={`text-3xl transition-colors ${
                      reel.isLiked ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-700'
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium ${getTextClass('secondary')}`}>{formatNumber(reel.likes)}</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/30 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/50' : 'hover:bg-white/50'} transition-colors`}>
                  <FaComment className={`text-3xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <span className={`text-sm font-medium ${getTextClass('secondary')}`}>{formatNumber(reel.comments)}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/30 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/50' : 'hover:bg-white/50'} transition-colors`}>
                  <FaShare className={`text-3xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <span className={`text-sm font-medium ${getTextClass('secondary')}`}>{formatNumber(reel.shares)}</span>
              </button>

              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500 animate-spin-slow">
                <FaMusic className="text-2xl text-blue-500" />
              </div>
            </div>

            {idx === activeIndex && (
              <button
                onClick={handleMute}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full ${isDark ? 'bg-black/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/70' : 'hover:bg-white/70'} transition-colors`}
              >
                {isMuted ? (
                  <FaVolumeMute className={`text-xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                ) : (
                  <FaVolumeUp className={`text-xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      <nav className={`fixed bottom-0 left-[72px] lg:left-[245px] right-0 xl:right-[320px] z-50 ${isDark ? 'bg-black/90 border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border-t px-4 pt-2 pb-4 flex justify-center items-center`}>
        <div className="flex justify-center items-center w-full">
          <button
            onClick={() => setShowCreateModal(true)}
            className="relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
              <FaPlus className="text-white text-2xl" />
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Create
            </span>
          </button>
        </div>
      </nav>

      <CreateReelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleReelCreated}
        isDarkMode={isDark}
        theme={theme}
      />

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); box-shadow: 0 0 4px rgba(255,255,255,0.4); }
          50% { opacity: 0.9; transform: scale(1.15); box-shadow: 0 0 15px rgba(255,255,255,0.9); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-2000 {
          animation-delay: 2s;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}