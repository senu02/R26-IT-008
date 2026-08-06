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
  FaHome,
  FaSearch,
  FaPlus,
  FaUser,
  FaCamera
} from 'react-icons/fa';
import { ThemeColors, getTheme } from '@/context/theme';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';

// Reels Data
const reelsData = [
  {
    id: '1',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: 'saman_k',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    caption: 'අපේ ගමේ ලස්සන දර්ශනයක් 🌅 #srilanka #nature',
    likes: 15234,
    comments: 234,
    shares: 567,
    isLiked: false,
    music: 'Nature Lovers - Original',
  },
  {
    id: '2',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    username: 'nimal_cooks',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    caption: 'සාම්ප්‍රදායික කෑම වට්ටෝරුවක් 🍛 #food #srilankanfood',
    likes: 8921,
    comments: 145,
    shares: 234,
    isLiked: false,
    music: 'Cooking Vibes - Remix',
  },
  {
    id: '3',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: 'dance_lisa',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    caption: 'බාලේ නර්තනයක් 💃 #dance #baila',
    likes: 45678,
    comments: 892,
    shares: 1234,
    isLiked: true,
    music: 'Baila Beats - DJ Mix',
  },
  {
    id: '4',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    username: 'travel_sl',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    caption: 'සිගිරියේ අලුත් අත්දැකීමක් 🏰 #sigiriya #travel',
    likes: 23456,
    comments: 567,
    shares: 890,
    isLiked: false,
    music: 'Travel Dreams - Ambient',
  },
  {
    id: '5',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    username: 'tech_ruwan',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    caption: 'AI එකෙන් හදපු Art එකක් 🎨 #ai #art',
    likes: 67890,
    comments: 1234,
    shares: 5678,
    isLiked: false,
    music: 'Tech Vibes - Electronic',
  },
  {
    id: '6',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    username: 'fitness_sl',
    userAvatar: 'https://i.pravatar.cc/150?img=6',
    caption: 'දිනපතා ව්‍යායාම රුටින් එක 💪 #fitness #health',
    likes: 12345,
    comments: 345,
    shares: 678,
    isLiked: false,
    music: 'Workout Beats - Gym Mix',
  },
];

interface HomePageProps {
  isDarkMode?: boolean;
  theme?: ThemeColors;
}

export default function HomePage({ isDarkMode = true, theme: customTheme }: HomePageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState(reelsData);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDark, setIsDark] = useState(isDarkMode);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get theme
  const theme = customTheme || getTheme(isDark);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle right sidebar (for mobile responsiveness)
  const toggleRightSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Handle scroll for reels
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const itemHeight = window.innerHeight;
        const index = Math.round(scrollTop / itemHeight);
        setActiveIndex(index);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Handle video play/pause based on active index
  useEffect(() => {
    if (videoRef.current) {
      if (activeIndex === activeIndex) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [activeIndex]);

  // Get current reel
  const currentReel = reels[activeIndex];

  // Handle like
  const handleLike = () => {
    const updatedReels = [...reels];
    const reel = updatedReels[activeIndex];
    if (reel.isLiked) {
      reel.isLiked = false;
      reel.likes -= 1;
    } else {
      reel.isLiked = true;
      reel.likes += 1;
    }
    setReels(updatedReels);
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle mute/unmute
  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  // Background classes based on theme
  const getBackgroundClass = () => {
    if (isDark) {
      return 'bg-black';
    }
    return 'bg-gradient-to-br from-[#f0f5ff] via-[#e4efff] to-[#f0f8ff]';
  };

  // Text classes based on theme
  const getTextClass = (type: keyof ThemeColors['text'] = 'primary') => {
    return theme.text[type];
  };

  // Surface classes based on theme
  const getSurfaceClass = (type: keyof ThemeColors['surface'] = 'glass') => {
    return theme.surface[type];
  };

  // Accent classes based on theme
  const getAccentClass = (type: keyof ThemeColors['accent'] = 'primary') => {
    return theme.accent[type];
  };

  // Generate star styles only on client side to avoid hydration mismatch
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

  // Only render stars after hydration
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

  return (
    <main className={`relative h-screen overflow-hidden ${getBackgroundClass()}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Right Sidebar - Desktop only */}
      <div className="hidden xl:block fixed right-0 top-0 h-screen w-[320px] z-40">
        <RightSidebar />
      </div>

      {/* Mobile toggle for right sidebar */}
      <button
        onClick={toggleRightSidebar}
        className="xl:hidden fixed right-4 bottom-20 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Background Stars for Dark Mode - Only render after hydration */}
      {isDark && isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          {renderStars()}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-indigo-500/3 blur-3xl animate-pulse-slow delay-2000"></div>
        </div>
      )}

      {/* Fallback for dark mode before hydration */}
      {isDark && !isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none ml-[72px] lg:ml-[245px] xl:mr-[320px]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-120 h-120 rounded-full bg-indigo-500/3 blur-3xl"></div>
        </div>
      )}

      {/* Header - Theme toggle button removed */}
      <header className={`fixed top-0 left-[72px] lg:left-[245px] right-0 xl:right-[320px] z-50 flex justify-between items-center px-4 py-3 ${
        isDark ? 'bg-gradient-to-b from-black/60 to-transparent' : 'bg-gradient-to-b from-white/60 to-transparent'
      }`}>
        <div className="flex items-center gap-2">
          <FaCamera className={`text-2xl ${getAccentClass('primary')}`} />
          <h1 className={`text-2xl font-bold ${getTextClass('primary')}`}>Mata Reels</h1>
        </div>
        <button className={`px-4 py-1 bg-gradient-to-r ${getAccentClass('gradient')} rounded-full text-sm font-semibold text-white`}>
          + Create
        </button>
      </header>

      {/* Reels Container - Adjusted for both sidebars */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll scrollbar-hide snap-y snap-mandatory relative ml-[72px] lg:ml-[245px] xl:mr-[320px]"
      >
        {reels.map((reel, idx) => (
          <div
            key={reel.id}
            className="relative w-full h-screen snap-start flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={idx === activeIndex ? videoRef : null}
              src={reel.videoUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onClick={handlePlayPause}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Play/Pause Overlay */}
            {!isPlaying && idx === activeIndex && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-black/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaPlay className={`text-4xl ${isDark ? 'text-white' : 'text-gray-800'}`} />
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-t from-black/80 via-transparent to-black/20' 
                : 'bg-gradient-to-t from-gray-900/40 via-transparent to-gray-900/10'
            } pointer-events-none`} />

            {/* Progress Bar */}
            {idx === activeIndex && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 z-10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Bottom Info */}
            <div className={`absolute bottom-32 left-4 right-24 flex flex-col gap-3 z-10 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  src={reel.userAvatar}
                  alt={reel.username}
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
                <h3 className={`font-bold text-lg ${getTextClass('primary')}`}>@{reel.username}</h3>
                <button className={`px-4 py-1 bg-gradient-to-r ${getAccentClass('gradient')} rounded-full text-sm font-semibold text-white`}>
                  Follow
                </button>
              </div>

              <p className={`text-sm ${getTextClass('secondary')}`}>{reel.caption}</p>

              {reel.music && (
                <div className={`flex items-center gap-2 text-sm ${getTextClass('muted')}`}>
                  <FaMusic className="text-xs" />
                  <span>{reel.music}</span>
                </div>
              )}
            </div>

            {/* Right Sidebar Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
                <img
                  src={reel.userAvatar}
                  alt={reel.username}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Like */}
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

              {/* Comments */}
              <button className="flex flex-col items-center gap-1 group">
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/30 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/50' : 'hover:bg-white/50'} transition-colors`}>
                  <FaComment className={`text-3xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <span className={`text-sm font-medium ${getTextClass('secondary')}`}>{formatNumber(reel.comments)}</span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1 group">
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-black/30 backdrop-blur-sm' : 'bg-white/30 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'hover:bg-black/50' : 'hover:bg-white/50'} transition-colors`}>
                  <FaShare className={`text-3xl ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <span className={`text-sm font-medium ${getTextClass('secondary')}`}>{formatNumber(reel.shares)}</span>
              </button>

              {/* Music */}
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500 animate-spin-slow">
                <FaMusic className="text-2xl text-blue-500" />
              </div>
            </div>

            {/* Mute Button */}
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

      {/* Bottom Navigation - Only Create Button */}
      <nav className={`fixed bottom-0 left-[72px] lg:left-[245px] right-0 xl:right-[320px] z-50 ${isDark ? 'bg-black/90 border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border-t px-4 pt-2 pb-4 flex justify-center items-center`}>
        <div className="flex justify-center items-center w-full">
          <button
            className="relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
              <FaPlus className="text-white text-2xl" />
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Create
            </span>
          </button>
        </div>
      </nav>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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