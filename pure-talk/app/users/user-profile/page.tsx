// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { ProfileCard } from '@/components/User/UserProfile/ProfileCard';
import { ActivityCard } from '@/components/User/UserProfile/ActivityCard';
import { BackgroundWrapper, getBackgroundClasses } from '@/context/theme';
import { 
  UserPlus, 
  MessageCircle, 
  MoreHorizontal, 
  Camera, 
  Smile, 
  Image as ImageIcon,
  ThumbsUp,
  Heart,
  Share2,
  Send,
  Globe,
  Users,
  Lock,
  Briefcase,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Heart as HeartIcon,
  GraduationCap,
  Home
} from 'lucide-react';

export default function ProfilePage() {
  const [isDark, setIsDark] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [activeStory, setActiveStory] = useState(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sample posts data
  const posts = [
    {
      id: 1,
      author: 'Nathan Garcia',
      avatar: 'https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia',
      time: '2 hours ago',
      privacy: 'public',
      content: 'Just finished an amazing UI/UX workshop! Learned so much about user-centered design principles. 🎨✨',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800',
      likes: 124,
      comments: 18,
      shares: 5,
      liked: false,
    },
    {
      id: 2,
      author: 'Nathan Garcia',
      avatar: 'https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia',
      time: 'Yesterday at 3:45 PM',
      privacy: 'friends',
      content: 'Excited to announce that I\'m working on a new design system for our upcoming product! Stay tuned for updates. 🚀',
      image: null,
      likes: 89,
      comments: 12,
      shares: 3,
      liked: true,
    },
    {
      id: 3,
      author: 'Nathan Garcia',
      avatar: 'https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia',
      time: '3 days ago',
      privacy: 'public',
      content: 'Check out this beautiful sunset I captured during my evening walk! 🌅',
      image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800',
      likes: 256,
      comments: 34,
      shares: 12,
      liked: false,
    },
  ];

  const stories = [
    { id: 1, name: 'Nathan Garcia', avatar: 'https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia', viewed: false },
    { id: 2, name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?background=4a90e2&color=fff&size=128&name=Sarah+Johnson', viewed: false },
    { id: 3, name: 'Mike Chen', avatar: 'https://ui-avatars.com/api/?background=34c759&color=fff&size=128&name=Mike+Chen', viewed: true },
    { id: 4, name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?background=ff9500&color=fff&size=128&name=Emma+Wilson', viewed: false },
    { id: 5, name: 'Alex Turner', avatar: 'https://ui-avatars.com/api/?background=af52de&color=fff&size=128&name=Alex+Turner', viewed: true },
  ];

  const friends = [
    { id: 1, name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?background=4a90e2&color=fff&size=128&name=Sarah+Johnson', mutual: 8 },
    { id: 2, name: 'Mike Chen', avatar: 'https://ui-avatars.com/api/?background=34c759&color=fff&size=128&name=Mike+Chen', mutual: 5 },
    { id: 3, name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?background=ff9500&color=fff&size=128&name=Emma+Wilson', mutual: 12 },
    { id: 4, name: 'Alex Turner', avatar: 'https://ui-avatars.com/api/?background=af52de&color=fff&size=128&name=Alex+Turner', mutual: 3 },
    { id: 5, name: 'Lisa Brown', avatar: 'https://ui-avatars.com/api/?background=64d2ff&color=fff&size=128&name=Lisa+Brown', mutual: 7 },
    { id: 6, name: 'Tom Harris', avatar: 'https://ui-avatars.com/api/?background=ff6b6b&color=fff&size=128&name=Tom+Harris', mutual: 4 },
  ];


  return (
    <BackgroundWrapper isDark={isDark}>
      {/* Left Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area with proper margin for fixed sidebar */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          {/* Mobile padding for menu button */}
          <div className="lg:hidden h-12"></div>
          
          {/* Cover Photo Section */}
          <div className="relative mb-28">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
              {/* Cover Image */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#fd297b] via-[#ff4d6d] to-[#ff655b]"></div>
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"
                alt="Cover"
                className="w-full h-full object-cover opacity-90"
              />
              
              {/* Edit Cover Button */}
              <button className={`absolute right-4 bottom-4 rounded-lg px-3 py-1.5 text-sm font-medium backdrop-blur-md transition-all ${
                isDark ? 'bg-black/50 text-white hover:bg-black/60' : 'bg-white/50 text-slate-700 hover:bg-white/60'
              }`}>
                <Camera className="inline h-4 w-4 mr-1" />
                Edit Cover
              </button>
            </div>

            {/* Profile Info Overlay */}
            <div className="absolute -bottom-20 left-4 md:left-8 flex flex-col md:flex-row md:items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className={`rounded-full border-4 shadow-xl ${isDark ? 'border-white/20 bg-white/10' : 'border-white/60 bg-white/40'} backdrop-blur-sm`}>
                  <div className="h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full">
                    <img
                      src="https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia"
                      alt="Nathan Garcia"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 rounded-full p-1.5 bg-[#fd297b] text-white shadow-lg">
                  <Camera className="h-3 w-3" />
                </button>
              </div>

              {/* Name and Bio */}
              <div className="mb-2">
                <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Nathan Garcia
                </h1>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  UI/UX Designer • Creative Problem Solver • Design Thinker
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute -bottom-20 right-4 flex gap-2">
              <button className="rounded-lg px-4 py-2 text-sm font-medium bg-[#fd297b] text-white hover:bg-[#e01e6a] transition-all shadow-lg">
                <UserPlus className="inline h-4 w-4 mr-1" />
                Add Friend
              </button>
              <button className={`rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-md transition-all shadow-lg ${
                isDark ? 'bg-black/50 text-white hover:bg-black/60' : 'bg-white/50 text-slate-700 hover:bg-white/60'
              }`}>
                <MessageCircle className="inline h-4 w-4 mr-1" />
                Message
              </button>
              <button className={`rounded-lg p-2 backdrop-blur-md transition-all shadow-lg ${
                isDark ? 'bg-black/50 text-white hover:bg-black/60' : 'bg-white/50 text-slate-700 hover:bg-white/60'
              }`}>
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>


          {/* Main Content Grid - Left side for posts, Right side for Intro/Friends/Photos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Posts Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Create Post */}
              <div className={`rounded-2xl shadow-xl p-4 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                <div className="flex gap-3">
                  <img 
                    src="https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia"
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <input
                    type="text"
                    placeholder="What's on your mind, Nathan?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm outline-none transition-all ${
                      isDark 
                        ? 'bg-white/10 text-white placeholder-white/50' 
                        : 'bg-white/50 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
                <div className="flex justify-around mt-3 pt-3 border-t border-white/20">
                  <button className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm transition-all ${
                    isDark ? 'text-white/70 hover:bg-white/10' : 'text-slate-600 hover:bg-white/30'
                  }`}>
                    <ImageIcon className="h-5 w-5 text-green-500" />
                    Photo/Video
                  </button>
                  <button className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm transition-all ${
                    isDark ? 'text-white/70 hover:bg-white/10' : 'text-slate-600 hover:bg-white/30'
                  }`}>
                    <Smile className="h-5 w-5 text-yellow-500" />
                    Feeling/Activity
                  </button>
                </div>
              </div>

              {/* Posts */}
              {posts.map((post) => (
                <div key={post.id} className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.author}</h4>
                          <div className="flex items-center gap-1 text-xs">
                            <span className={isDark ? 'text-white/50' : 'text-slate-500'}>{post.time}</span>
                            <span className={isDark ? 'text-white/30' : 'text-slate-300'}>•</span>
                            <div className={`flex items-center gap-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                         
                              <span className="text-xs capitalize">{post.privacy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className={isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-600'}>
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Post Content */}
                    <p className={`mt-3 text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{post.content}</p>
                    
                    {/* Post Image */}
                    {post.image && (
                      <div className="mt-3 -mx-4">
                        <img src={post.image} alt="Post" className="w-full" />
                      </div>
                    )}
                    
                    {/* Post Stats */}
                    <div className="flex items-center justify-between mt-3 pt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-blue-500" />
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className={isDark ? 'text-white/50' : 'text-slate-500'}>{post.likes}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className={isDark ? 'text-white/50' : 'text-slate-500'}>{post.comments} comments</span>
                        <span className={isDark ? 'text-white/50' : 'text-slate-500'}>{post.shares} shares</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Actions */}
                  <div className={`flex border-t ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${
                      post.liked 
                        ? 'text-[#fd297b]' 
                        : isDark ? 'text-white/60 hover:bg-white/5' : 'text-slate-600 hover:bg-white/20'
                    }`}>
                      <ThumbsUp className="h-5 w-5" />
                      Like
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${
                      isDark ? 'text-white/60 hover:bg-white/5' : 'text-slate-600 hover:bg-white/20'
                    }`}>
                      <MessageCircle className="h-5 w-5" />
                      Comment
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${
                      isDark ? 'text-white/60 hover:bg-white/5' : 'text-slate-600 hover:bg-white/20'
                    }`}>
                      <Share2 className="h-5 w-5" />
                      Share
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${
                      isDark ? 'text-white/60 hover:bg-white/5' : 'text-slate-600 hover:bg-white/20'
                    }`}>
                      <Send className="h-5 w-5" />
                      Send
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Intro, Friends, Photos */}
            <div className="lg:col-span-1 space-y-4">
              {/* Intro Card */}
              <div className={`rounded-2xl shadow-xl p-4 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Intro</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Briefcase className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>UI/UX Designer at Design Studio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Studied at California College of the Arts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Lives in San Francisco, California</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>From New York, USA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HeartIcon className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Single</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Born January 15, 1992</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>+1 234 567 8900</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>nathan.garcia@example.com</span>
                  </div>
                </div>
              </div>

              {/* Friends Card */}
              <div className={`rounded-2xl shadow-xl p-4 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Friends</h3>
                  <button className={`text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    See All Friends
                  </button>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>247 friends</p>
                <div className="grid grid-cols-3 gap-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="text-center cursor-pointer transition-transform hover:scale-105">
                      <img src={friend.avatar} alt={friend.name} className="w-full rounded-lg mb-1" />
                      <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-700'}`}>{friend.name}</p>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{friend.mutual} mutual</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos Card */}
              <div className={`rounded-2xl shadow-xl p-4 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Photos</h3>
                  <button className={`text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    See All Photos
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/id/${i + 10}/200/200`} 
                      alt={`Photo ${i}`}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
}