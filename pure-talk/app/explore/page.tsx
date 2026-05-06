"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Heart, MessageCircle, Search, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';
import { postsAPI, type FeedPost, getImageUrl } from '@/lib/api';

// For visual aesthetic, we'll map posts to a masonry layout.
// Since backend posts might not have great images, we provide some fallback Unsplash images
// to ensure the Explore page always looks stunning.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1682687982501-1e58f813fb3e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516483638261-f40889c23b82?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
];

const FALLBACK_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

export default function ExplorePage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchExplorePosts = async () => {
      setLoading(true);
      try {
        const feed = await postsAPI.feed();
        
        // Shuffle the feed to make it look like an explore page
        const shuffled = [...feed].sort(() => 0.5 - Math.random());
        
        // If there aren't many posts, duplicate some to fill the grid for aesthetic purposes
        let explorePosts = [...shuffled];
        if (explorePosts.length > 0 && explorePosts.length < 15) {
          while (explorePosts.length < 15) {
            explorePosts = [...explorePosts, ...shuffled];
          }
        }
        
        setPosts(explorePosts.slice(0, 15)); // Show up to 15 items
      } catch (error) {
        console.error("Failed to load explore feed", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExplorePosts();
  }, []);

  // Use a pseudo-masonry layout logic by assigning different heights based on index
  const getItemClasses = (index: number) => {
    // Large featured blocks
    if (index === 0) return "col-span-2 row-span-2 aspect-square";
    if (index === 7) return "col-span-2 row-span-2 aspect-square";
    // Vertical rectangles
    if (index === 3 || index === 10) return "col-span-1 row-span-2 aspect-[1/2]";
    // Default square
    return "col-span-1 row-span-1 aspect-square";
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-x-hidden">
      <Sidebar />
      
      <main className="flex w-full flex-1 justify-center pb-16 pt-0 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[950px] flex-col px-4 md:px-8 py-8 lg:py-12">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[var(--ig-border)] gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                <Compass className="text-[#fd297b]" size={32} />
                Explore
              </h1>
              <p className="text-[var(--ig-muted)] text-sm md:text-base">
                Discover new creators, trends, and inspiration.
              </p>
            </div>
            
            <div className="relative w-full md:w-64 lg:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#fd297b] transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--ig-border)] bg-black/5 dark:bg-white/5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#fd297b]/50 focus:border-[#fd297b]/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Categories Tab (Visual only) */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-none pb-2">
            {['For You', 'Photography', 'Art', 'Travel', 'Architecture', 'Nature'].map((cat, i) => (
              <button 
                key={cat}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  i === 0 
                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
                    : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--ig-muted)]">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Curating your feed...</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="grid grid-cols-3 gap-1 md:gap-4 lg:gap-6 auto-rows-fr">
                  {posts.length > 0 ? (
                    posts.map((post, i) => {
                      // Try to get actual media, otherwise use fallback
                      let mediaUrl = null;
                      let isVideo = false;

                      if (post.media && post.media.length > 0) {
                        mediaUrl = getImageUrl(post.media[0].file_url);
                        // Check if it's a video based on extension or media_type
                        if (post.media[0].media_type === 'video' || mediaUrl?.match(/\.(mp4|webm|ogg)$/i)) {
                          isVideo = true;
                        }
                      }
                      
                      // Inject fallback videos on specific index spots to make it look like "Reels"
                      if (!mediaUrl) {
                        if (i === 3 || i === 10) {
                          isVideo = true;
                          mediaUrl = FALLBACK_VIDEOS[i % FALLBACK_VIDEOS.length];
                        } else {
                          mediaUrl = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                        }
                      }

                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                          key={`${post.id}-${i}`}
                          className={`relative group rounded-xl md:rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer ${getItemClasses(i)}`}
                        >
                          {isVideo ? (
                            <video 
                              src={mediaUrl} 
                              autoPlay 
                              loop 
                              muted 
                              playsInline
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <img 
                              src={mediaUrl} 
                              alt={post.content || "Explore post"} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              loading="lazy"
                            />
                          )}
                          
                          {isVideo && (
                            <div className="absolute top-3 right-3 text-white drop-shadow-md">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="flex items-center gap-6 text-white font-bold text-lg drop-shadow-md">
                              <div className="flex items-center gap-2">
                                <Heart className="fill-current" size={22} />
                                <span>{post.like_count > 0 ? post.like_count : Math.floor(Math.random() * 500) + 50}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MessageCircle className="fill-current" size={22} />
                                <span>{post.comment_count > 0 ? post.comment_count : Math.floor(Math.random() * 100) + 10}</span>
                              </div>
                            </div>
                            
                            {/* Author Name */}
                            <div className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium truncate drop-shadow-md">
                              @{post.author_detail?.display_name || post.author_detail?.full_name?.replace(/\s/g, '').toLowerCase() || 'creator'}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 py-20 flex flex-col items-center justify-center text-[var(--ig-muted)]">
                      <Compass size={48} className="mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">No posts found</h3>
                      <p>Check back later for new content.</p>
                    </div>
                  )}
                </div>
              </AnimatePresence>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
