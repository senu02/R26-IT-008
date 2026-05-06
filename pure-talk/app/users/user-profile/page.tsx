// app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
import PostsPage from '@/app/users/posts/page'; // Posts page eka import karanawa
import { getTheme } from '@/context/theme';
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

export default function ProfilePage() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const [selectedAvatarImage, setSelectedAvatarImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const theme = getTheme(isDark);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    loadUserData();
    
    return () => observer.disconnect();
  }, []);

  const loadUserData = () => {
    const userData = getCurrentUserData();
    setUser(userData);
    setLoading(false);
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
    try {
      const formData = new FormData();
      formData.append('cover_image', selectedCoverImage);
      
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setShowCoverModal(false);
        setSelectedCoverImage(null);
        setCoverPreview(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatarImage) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', selectedAvatarImage);
      
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setShowAvatarModal(false);
        setSelectedAvatarImage(null);
        setAvatarPreview(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getAccountStatusDisplay = () => {
    if (!user) return null;
    
    if (user.account_status === 'suspended') {
      return (
        <div className="mt-2 p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Account Suspended until {user.suspended_until ? new Date(user.suspended_until).toLocaleDateString() : 'N/A'}
            {user.suspension_reason && ` - Reason: ${user.suspension_reason}`}
          </p>
        </div>
      );
    }
    
    if (user.account_status === 'banned') {
      return (
        <div className="mt-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
          <p className="text-xs text-red-600 dark:text-red-400">
            🚫 Account Banned - {user.banned_reason || 'No reason provided'}
          </p>
        </div>
      );
    }
    
    return null;
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleColors = {
      super_admin: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      admin: 'bg-red-500/20 text-red-600 dark:text-red-400',
      moderator: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      user: 'bg-green-500/20 text-green-600 dark:text-green-400'
    };
    
    const roleNames = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      moderator: 'Moderator',
      user: 'Member'
    };
    
    const role = user.role || 'user';
    
    return (
      <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${roleColors[role as keyof typeof roleColors] || roleColors.user}`}>
        {roleNames[role as keyof typeof roleNames] || role}
      </span>
    );
  };

  const friends = [
    { id: 1, name: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?background=4a90e2&color=fff&size=128&name=Sarah+Johnson', mutual: 8 },
    { id: 2, name: 'Mike Chen', avatar: 'https://ui-avatars.com/api/?background=34c759&color=fff&size=128&name=Mike+Chen', mutual: 5 },
    { id: 3, name: 'Emma Wilson', avatar: 'https://ui-avatars.com/api/?background=ff9500&color=fff&size=128&name=Emma+Wilson', mutual: 12 },
    { id: 4, name: 'Alex Turner', avatar: 'https://ui-avatars.com/api/?background=af52de&color=fff&size=128&name=Alex+Turner', mutual: 3 },
  ];

  if (loading) {
    return (
      <BackgroundWrapper isDark={isDark}>
        <Sidebar />
        <div className="flex-1 lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fd297b] mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      {/* Left Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          {/* Mobile padding */}
          <div className="lg:hidden h-12"></div>
          
          {/* Cover Photo Section */}
          <div className="relative mb-28">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl group">
              {/* Cover Image */}
              {user?.cover_image ? (
                <img 
                  src={getImageUrl(user.cover_image) || undefined}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#fd297b] via-[#ff4d6d] to-[#ff655b]"></div>
              )}
              
              {/* Cover overlay for edit button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button 
                  onClick={() => coverInputRef.current?.click()}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-white/90 text-slate-700 hover:bg-white transition-all"
                >
                  <Camera className="inline h-4 w-4 mr-2" />
                  Edit Cover Photo
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
            <div className="absolute -bottom-20 left-4 md:left-8 flex flex-col md:flex-row md:items-end gap-4">
              {/* Avatar with edit button */}
              <div className="relative group">
                <div className={`rounded-full border-4 shadow-xl ${isDark ? 'border-white/20 bg-white/10' : 'border-white/60 bg-white/40'} backdrop-blur-sm`}>
                  <div className="h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full">
                    <img
                      src={getImageUrl(user?.profile_picture) || `https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`}
                      alt={user?.full_name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Edit avatar button */}
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full p-1.5 bg-[#fd297b] text-white shadow-lg hover:scale-110 transition-transform duration-200"
                >
                  <Camera className="h-3 w-3" />
                </button>
                
                {/* Hidden file input for avatar */}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.full_name || 'User Name'}
                  </h1>
                  {getRoleBadge()}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {user?.bio || 'No bio yet'}
                </p>
                {getAccountStatusDisplay()}
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

          {/* Cover Image Upload Modal */}
          {showCoverModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !uploading && setShowCoverModal(false)}>
              <div className={`relative max-w-lg w-full rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl animate-in zoom-in duration-300`} onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Update Cover Photo
                  </h3>
                  <button
                    onClick={() => !uploading && setShowCoverModal(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
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
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadCover}
                      disabled={uploading}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !uploading && setShowAvatarModal(false)}>
              <div className={`relative max-w-md w-full rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl animate-in zoom-in duration-300`} onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Update Profile Picture
                  </h3>
                  <button
                    onClick={() => !uploading && setShowAvatarModal(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  {avatarPreview && (
                    <div className="mb-4 flex justify-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#fd297b]">
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
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
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadAvatar}
                      disabled={uploading}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
            {/* Left Column - Posts Feed */}
            <div className="lg:col-span-2">
              {/* Etanne Posts page eka */}
              <PostsPage />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-4">
              {/* Intro Card */}
              <div className={`rounded-2xl shadow-xl p-4 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Intro</h3>
                <div className="space-y-3 text-sm">
                  {user?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                      <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Lives in {user.location}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                      <span className={isDark ? 'text-white/80' : 'text-slate-700'}>{user.email}</span>
                    </div>
                  )}
                  {user?.mobile_number && (
                    <div className="flex items-center gap-3">
                      <Phone className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                      <span className={isDark ? 'text-white/80' : 'text-slate-700'}>{user.mobile_number}</span>
                    </div>
                  )}
                  {user?.birthday && (
                    <div className="flex items-center gap-3">
                      <Calendar className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                      <span className={isDark ? 'text-white/80' : 'text-slate-700'}>Born {new Date(user.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
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