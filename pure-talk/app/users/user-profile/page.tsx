// app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/User/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
import PostsPage from '@/app/users/posts/page';
import { getTheme } from '@/context/theme';
import { ToastProvider, useToast } from '@/context/userToast';
import { 
  UserPlus, 
  MessageCircle, 
  MoreHorizontal, 
  Camera, 
  MapPin,
  Mail,
  Phone,
  Calendar,
  Upload,
  Check,
  X
} from 'lucide-react';
import { getCurrentUserData, getImageUrl, authAPI, User } from '@/lib/api';
import { friendsAPI, Friendship } from '@/app/services/friends/actions';
import PostSection from '@/components/User/Posts/PostSection';
import { postAPI } from '@/app/services/posts/actions';

// Instagram-esque story-ring gradient
const IG_GRADIENT = 'linear-gradient(45deg, #F9CE34 0%, #EE2A7B 55%, #6228D7 100%)';
const IG_BLUE = '#0095F6';
const IG_RED = '#ED4956';

export default function ProfilePage() {
  return (
    <ToastProvider>
      <ProfilePageContent />
    </ToastProvider>
  );
}

function ProfilePageContent() {
  const toast = useToast();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const theme = getTheme(isDark);

  // Avatar used in the Instagram-style toast
  const myAvatar = avatarPreview
    || getImageUrl(user?.profile_picture)
    || `https://ui-avatars.com/api/?background=262626&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`;

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark !== false);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    loadUserData();
    loadFriends();
    loadUserPhotos();
    
    return () => observer.disconnect();
  }, []);

  const loadUserData = () => {
    const userData = getCurrentUserData();
    setUser(userData);
    setLoading(false);
  };

  const loadUserPhotos = async () => {
    setPhotosLoading(true);
    try {
      const myPosts = await postAPI.getMyPosts();
      const photos = myPosts
        .filter(p => !!p.image && p.image.trim() !== '')
        .map(p => p.image as string);
      setUserPhotos(photos);
    } catch (err) {
      console.error('Error loading user photos:', err);
      setUserPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  const loadFriends = async () => {
    setFriendsLoading(true);
    setError(null);
    try {
      console.log('Loading friends...');
      const friendsData = await friendsAPI.getFriendsList();
      console.log('Friends data:', friendsData);
      console.log('Number of friends:', friendsData.length);
      setFriends(friendsData);
    } catch (error: any) {
      console.error('Error loading friends:', error);
      setError(error?.message || 'Failed to load friends');
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
      setShowCoverModal(true);
    }
  };

  const handleAvatarImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatarImage(file);
      setAvatarPreview(URL.createObjectURL(file));
      setShowAvatarModal(true);
    }
  };

  const handleUploadCover = async () => {
    if (!selectedCoverImage) return;
    
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('cover_image', selectedCoverImage);
      
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      
      setUploadSuccess(true);

      toast.showInstagramToast(
        'updated their cover photo 🖼️',
        updatedUser?.full_name || user?.full_name || 'You',
        myAvatar,
        'like'
      );

      setTimeout(() => {
        setShowCoverModal(false);
        setSelectedCoverImage(null);
        setCoverPreview(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error uploading cover image:', err);
      setError(err?.message || 'Failed to upload cover image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatarImage) return;
    
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('profile_picture', selectedAvatarImage);
      
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      
      setUploadSuccess(true);

      toast.showInstagramToast(
        'updated their profile picture 📸',
        updatedUser?.full_name || user?.full_name || 'You',
        myAvatar,
        'like'
      );

      setTimeout(() => {
        setShowAvatarModal(false);
        setSelectedAvatarImage(null);
        setAvatarPreview(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err?.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getAccountStatusDisplay = () => {
    if (!user) return null;
    
    if (user.account_status === 'suspended') {
      return (
        <div className={`mt-2 p-2 rounded-lg border ${isDark ? 'bg-[#3a2f10] border-[#5c4b1a]' : 'bg-[#FFF8E1] border-[#F4D35E]'}`}>
          <p className={`text-xs ${isDark ? 'text-[#F4D35E]' : 'text-[#8a6d00]'}`}>
            ⚠️ Account Suspended until {user.suspended_until ? new Date(user.suspended_until).toLocaleDateString() : 'N/A'}
            {user.suspension_reason && ` - Reason: ${user.suspension_reason}`}
          </p>
        </div>
      );
    }
    
    if (user.account_status === 'banned') {
      return (
        <div className={`mt-2 p-2 rounded-lg border ${isDark ? 'bg-[#3a1414] border-[#5c1a1a]' : 'bg-[#FDECEC] border-[#f5b5b5]'}`}>
          <p className={`text-xs ${isDark ? 'text-[#ff6b6b]' : 'text-[#ED4956]'}`}>
            🚫 Account Banned - {user.banned_reason || 'No reason provided'}
          </p>
        </div>
      );
    }
    
    return null;
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleColors: Record<string, string> = {
      super_admin: isDark ? 'bg-[#2a1a3d] text-[#c996ff]' : 'bg-[#F3E8FF] text-[#8134AF]',
      admin: isDark ? 'bg-[#3a1414] text-[#ff8080]' : 'bg-[#FDECEC] text-[#ED4956]',
      moderator: isDark ? 'bg-[#0a2540] text-[#66c2ff]' : 'bg-[#E8F4FF] text-[#0095F6]',
      user: isDark ? 'bg-[#132b1a] text-[#6fcf97]' : 'bg-[#E8F7EE] text-[#2E9E5B]'
    };
    
    const roleNames = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      moderator: 'Moderator',
      user: 'Member'
    };
    
    const role = user.role || 'user';
    
    return (
      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${roleColors[role] || roleColors.user}`}>
        {roleNames[role as keyof typeof roleNames] || role}
      </span>
    );
  };

  // Shared style fragments
  const cardClass = 'bg-[#10151f]/95 backdrop-blur-xl border border-rose-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.6)] rounded-3xl p-5 hover:border-rose-500/40 transition-all text-slate-100';

  if (loading) {
    return (
      <BackgroundWrapper isDark={isDark}>
        <Sidebar />
        <div className="flex-1 lg:ml-[245px] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mx-auto"
              style={{ borderImage: `${IG_GRADIENT} 1` }}
            ></div>
            <p className={`mt-4 text-sm ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>Loading profile…</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      <div className="flex min-h-screen font-sans selection:bg-red-500 selection:text-white max-w-[1440px] mx-auto">
        {/* Left Sidebar - Fixed */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-[245px] min-h-screen text-slate-100">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          {/* Mobile padding */}
          <div className="lg:hidden h-12"></div>

          {error && (
            <p className="mb-4 px-1 text-center text-xs text-red-500 font-medium">
              {error}
            </p>
          )}
          
          {/* Cover Photo & Profile Hero Header */}
          <div className="relative mb-28">
            {/* Cover Banner */}
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden group border border-slate-800/80 shadow-2xl">
              {/* Cover Image */}
              {user?.cover_image ? (
                <img 
                  src={getImageUrl(user.cover_image) || undefined}
                  alt="Cover"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-rose-900 to-slate-900">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent"></div>
                </div>
              )}

              {/* Ambient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-black/30"></div>
              
              {/* Cover overlay for edit button */}
              <div className="absolute top-4 right-4 opacity-90 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  className="rounded-xl px-4 py-2 text-xs font-bold bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-xl border border-white/20 flex items-center gap-2"
                >
                  <Camera className="h-4 w-4 text-red-400" />
                  <span>Edit Cover</span>
                </button>
              </div>
              
              {/* Hidden file input for cover */}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageSelect}
                className="hidden"
              />
            </div>

            {/* Profile Info Overlay */}
            <div className="absolute -bottom-20 left-4 md:left-8 flex flex-col md:flex-row md:items-end gap-5 right-4 justify-between">
              <div className="flex flex-col md:flex-row md:items-end gap-5">
                {/* Avatar with edit button */}
                <div className="relative group">
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-300 shadow-[0_0_25px_rgba(244,63,94,0.4)] ring-4 ring-[#0b0f17]">
                    <div className="p-[2px] rounded-full bg-[#0b0f17]">
                      <div className="h-24 w-24 md:h-36 md:w-36 overflow-hidden rounded-full border border-slate-700/60">
                        <img
                          src={getImageUrl(user?.profile_picture) || `https://ui-avatars.com/api/?background=1e293b&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`}
                          alt={user?.full_name || 'User'}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 right-1 rounded-full p-2.5 text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-xl hover:scale-110 transition-transform duration-200 border-2 border-[#0b0f17]"
                    title="Change Profile Photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Name and Bio */}
                <div className="mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      {user?.full_name || 'User Name'}
                    </h1>
                    {getRoleBadge()}
                  </div>
                  <p className="text-sm text-slate-200 mt-1 max-w-lg font-medium leading-relaxed drop-shadow-sm">
                    {user?.bio || 'No bio added yet'}
                  </p>
                  {getAccountStatusDisplay()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mb-2 self-start md:self-end">
                <button
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-500 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all shadow-[0_4px_20px_rgba(244,63,94,0.35)] hover:scale-105 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Friend</span>
                </button>
                <button className="rounded-xl px-4 py-2.5 text-sm font-semibold border border-rose-500/30 bg-[#10151f]/80 backdrop-blur-md text-slate-100 hover:bg-[#10151f] hover:text-white transition-all shadow-md hover:scale-105 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-rose-400" />
                  <span>Message</span>
                </button>
                <button className="rounded-xl p-2.5 border border-rose-500/30 bg-[#10151f]/80 backdrop-blur-md text-slate-100 hover:bg-[#10151f] hover:text-white transition-all shadow-md hover:scale-105">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>

          {/* Quick Stats Bar */}
          <div className="mb-8 grid grid-cols-3 gap-3 md:gap-6 bg-[#10151f]/95 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-4 md:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col items-center justify-center border-r border-slate-800/80 pr-2 md:pr-4">
              <span className="text-xl md:text-3xl font-black bg-gradient-to-r from-red-500 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                {friends.length}
              </span>
              <span className="text-xs md:text-sm text-rose-400/90 font-bold uppercase tracking-wider mt-0.5">
                Friends
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-slate-800/80 px-2 md:px-4">
              <span className="text-xl md:text-3xl font-black text-slate-100">
                {photosLoading ? '...' : userPhotos.length}
              </span>
              <span className="text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                Photos
              </span>
            </div>
            <div className="flex flex-col items-center justify-center pl-2 md:pl-4">
              <span className="text-xl md:text-3xl font-black text-emerald-400">
                100%
              </span>
              <span className="text-xs md:text-sm text-emerald-400/90 font-bold uppercase tracking-wider mt-0.5">
                Verified
              </span>
            </div>
          </div>

          {/* Cover Image Upload Modal */}
          {showCoverModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !uploading && setShowCoverModal(false)}>
              <div className={`relative max-w-lg w-full rounded-2xl overflow-hidden ${isDark ? 'bg-[#121212] border border-[#262626]' : 'bg-white border border-[#DBDBDB]'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-[#262626]' : 'border-[#DBDBDB]'}`}>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    Update Cover Photo
                  </h3>
                  <button
                    onClick={() => !uploading && setShowCoverModal(false)}
                    className={`p-1 rounded-lg transition-all ${isDark ? 'hover:bg-[#1c1c1c] text-white' : 'hover:bg-[#FAFAFA] text-[#262626]'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  {coverPreview && (
                    <div className="mb-4">
                      <img src={coverPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCoverModal(false);
                        setSelectedCoverImage(null);
                        setCoverPreview(null);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isDark ? 'bg-[#1c1c1c] text-[#a8a8a8] hover:bg-[#262626]' : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#EFEFEF]'
                      }`}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadCover}
                      disabled={uploading}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: IG_BLUE }}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : uploadSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Uploaded!
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Cover
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avatar Image Upload Modal */}
          {showAvatarModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !uploading && setShowAvatarModal(false)}>
              <div className={`relative max-w-md w-full rounded-2xl overflow-hidden ${isDark ? 'bg-[#121212] border border-[#262626]' : 'bg-white border border-[#DBDBDB]'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-[#262626]' : 'border-[#DBDBDB]'}`}>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    Update Profile Picture
                  </h3>
                  <button
                    onClick={() => !uploading && setShowAvatarModal(false)}
                    className={`p-1 rounded-lg transition-all ${isDark ? 'hover:bg-[#1c1c1c] text-white' : 'hover:bg-[#FAFAFA] text-[#262626]'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  {avatarPreview && (
                    <div className="mb-4 flex justify-center">
                      <div className="p-[3px] rounded-full" style={{ background: IG_GRADIENT }}>
                        <div className={`p-[3px] rounded-full ${isDark ? 'bg-black' : 'bg-white'}`}>
                          <div className="w-40 h-40 rounded-full overflow-hidden">
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAvatarModal(false);
                        setSelectedAvatarImage(null);
                        setAvatarPreview(null);
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isDark ? 'bg-[#1c1c1c] text-[#a8a8a8] hover:bg-[#262626]' : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#EFEFEF]'
                      }`}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadAvatar}
                      disabled={uploading}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      style={{ backgroundColor: IG_BLUE }}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : uploadSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Uploaded!
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Photo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User Image Posts Feed */}
            <div className="lg:col-span-2">
              <PostSection 
                theme={theme} 
                isDark={true} 
                defaultFilter="My Posts" 
                onlyMyPosts={true} 
                onlyImages={true} 
                hideFilterTabs={true} 
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-4">
              {/* Intro Card */}
              <div className={`rounded-2xl p-4 ${cardClass}`}>
                <h3 className="text-base font-bold mb-3 text-slate-100">Intro</h3>
                <div className="space-y-3 text-sm font-medium">
                  {user?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-rose-400" />
                      <span className="text-slate-200">Lives in {user.location}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-rose-400" />
                      <span className="text-slate-200">{user.email}</span>
                    </div>
                  )}
                  {user?.mobile_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-rose-400" />
                      <span className="text-slate-200">{user.mobile_number}</span>
                    </div>
                  )}
                  {user?.birthday && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-rose-400" />
                      <span className="text-slate-200">Born {new Date(user.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Friends Card - Dynamic from API */}
              <div className={`rounded-2xl p-4 ${cardClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-100">Friends</h3>
                  <button className="text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors">
                    See All Friends
                  </button>
                </div>
                
                {friendsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-sm text-center py-6 text-slate-400">
                    No friends yet. Start connecting with people!
                  </p>
                ) : (
                  <>
                    <p className="text-sm mb-3 text-slate-400">
                      {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {friends.slice(0, 9).map((friendship) => {
                        const friend = friendship.friend_detail;
                        if (!friend) return null;
                        
                        const friendName = friend.full_name || friend.email || 'Unknown';
                        const friendAvatar = getImageUrl(friend.profile_picture) || 
                          `https://ui-avatars.com/api/?background=1e293b&color=fff&size=128&name=${encodeURIComponent(friendName)}`;
                        
                        return (
                          <div key={friendship.id} className="text-center cursor-pointer transition-transform hover:scale-105">
                            <img 
                              src={friendAvatar} 
                              alt={friendName} 
                              className="w-full rounded-lg mb-1 aspect-square object-cover border border-slate-700/50"
                            />
                            <p className="text-xs font-medium truncate text-slate-200">
                              {friendName.split(' ').slice(0, 2).join(' ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    
                    {friends.length > 9 && (
                      <button className="w-full mt-3 text-center text-sm font-semibold text-red-500 hover:text-red-400 transition-colors">
                        Show {friends.length - 9} more friends
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Photos Card - Dynamic from User Image Posts */}
              <div className={`rounded-2xl p-4 ${cardClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-slate-100">Photos</h3>
                  <button className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors">
                    See All Photos
                  </button>
                </div>
                {photosLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                  </div>
                ) : userPhotos.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400">
                    No photo posts uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {userPhotos.slice(0, 9).map((photoUrl, i) => (
                      <img 
                        key={i}
                        src={photoUrl} 
                        alt={`Photo ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg cursor-pointer transition-transform hover:scale-105 border border-slate-700/50"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </BackgroundWrapper>
  );
}