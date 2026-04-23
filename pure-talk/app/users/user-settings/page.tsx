// app/users/user-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
import {
  Bell,
  Palette,
  Globe,
  Shield,
  CreditCard,
  Users,
  Mail,
  Phone,
  Camera,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Save,
  Trash2,
  LogOut,
  Fingerprint,
  Laptop,
  Smartphone,
  Volume2,
  Languages,
  Clock,
  Award,
  Download,
  HelpCircle,
  Gift,
  MessageCircle,
  FileText,
  Zap,
  Cloud,
  Database,
  Key,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  Briefcase,
  Link2,
  AtSign,
  Hash,
  Mail as MailIcon,
  PhoneCall,
  Flag,
  Star,
  Crown,
  QrCode,
  X
} from 'lucide-react';
import { getCurrentUserData, authAPI, userAPI, getImageUrl, isAdmin, User, ChangePasswordData } from '@/lib/api';

export default function UserSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    location: '',
    bio: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [previewCoverImage, setPreviewCoverImage] = useState<string | null>(null);

  useEffect(() => {
    // Get section from URL params
    const section = searchParams.get('section');
    if (section && ['profile', 'appearance'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
      
      // Detect current theme preference
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        setSelectedTheme(savedTheme);
      } else {
        setSelectedTheme('system');
      }
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Load user data
    loadUserData();
    
    return () => observer.disconnect();
  }, []);

  const loadUserData = () => {
    const userData = getCurrentUserData();
    if (userData) {
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        mobile_number: userData.mobile_number || '',
        location: userData.location || '',
        bio: userData.bio || '',
      });
    }
    setLoading(false);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = async () => {
    setSaved(true);
    
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        location: formData.location,
        bio: formData.bio,
      };
      
      if (profilePicture) {
        updateData.profile_picture = profilePicture;
      }
      
      if (coverImage) {
        updateData.cover_image = coverImage;
      }
      
      const updatedUser = await authAPI.updateProfile(updateData);
      setUser(updatedUser);
      
      // Show success message
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaved(false);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    
    try {
      if (user) {
        await authAPI.changePassword(user.id, passwordData);
        alert('Password changed successfully! Please login again.');
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        // Optionally logout and redirect to login
        // await authAPI.logout();
        // router.push('/login');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Please enter your password to confirm account deletion:');
    if (password) {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        try {
          await authAPI.deleteAccount(password);
          alert('Account deleted successfully');
          router.push('/login');
        } catch (error: any) {
          console.error('Error deleting account:', error);
          alert(error.message || 'Failed to delete account');
        }
      }
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewProfilePicture(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setPreviewCoverImage(URL.createObjectURL(file));
    }
  };

  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      setShowTwoFactorSetup(true);
    } else {
      setTwoFactorEnabled(false);
    }
  };

  if (loading) {
    return (
      <BackgroundWrapper isDark={isDark}>
        <Sidebar />
        <div className="flex-1 lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fd297b] mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      <Sidebar />

      <div className="flex-1 lg:ml-72 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          <div className="lg:hidden h-12"></div>

          {/* Header with Gradient */}
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#fd297b]/20 to-[#ff655b]/20 mb-4">
              <Sparkles className="h-4 w-4 text-[#fd297b]" />
              <span className="text-xs font-medium text-[#fd297b]">Settings</span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#fd297b] to-[#ff655b] bg-clip-text text-transparent`}>
              Customize Your Experience
            </h1>
            <p className={`mt-3 text-base ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveSection('profile')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeSection === 'profile'
                  ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-lg'
                  : isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white/50 text-slate-700 hover:bg-white/70'
              }`}
            >
           
              Profile Settings
            </button>
            <button
              onClick={() => setActiveSection('appearance')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeSection === 'appearance'
                  ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-lg'
                  : isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white/50 text-slate-700 hover:bg-white/70'
              }`}
            >
              <Palette className="inline h-4 w-4 mr-2" />
              Appearance
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile Picture</h2>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="relative group">
                      <div className={`rounded-full border-4 shadow-xl transition-all duration-300 group-hover:scale-105 ${isDark ? 'border-white/20' : 'border-white/60'}`}>
                        <img
                          src={previewProfilePicture || getImageUrl(user?.profile_picture) || `https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`}
                          alt="Profile"
                          className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover"
                        />
                      </div>
                      <label className="absolute bottom-0 right-0 rounded-full p-2 bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer">
                        <Camera className="h-3.5 w-3.5" />
                        <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        JPG, GIF or PNG. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover Image Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Cover Image</h2>
                  <div className="relative group">
                    <div className="relative h-40 rounded-xl overflow-hidden">
                      <img
                        src={previewCoverImage || getImageUrl(user?.cover_image) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                        <Camera className="h-8 w-8 text-white" />
                        <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Personal Info Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Personal Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                   
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.02] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                    <div className="group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        <MailIcon className="inline h-3.5 w-3.5 mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.02] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                    <div className="group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        <PhoneCall className="inline h-3.5 w-3.5 mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.02] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                    <div className="group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        <MapPin className="inline h-3.5 w-3.5 mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.02] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                    <div className="md:col-span-2 group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Bio</label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.01] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                              : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                          } border pr-10`}
                          placeholder="Enter current password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-white/40" /> : <Eye className="h-4 w-4 text-white/40" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                              : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                          } border pr-10`}
                          placeholder="Enter new password"
                        />
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4 text-white/40" /> : <Eye className="h-4 w-4 text-white/40" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                              : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                          } border pr-10`}
                          placeholder="Confirm new password"
                        />
                        <button
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-white/40" /> : <Eye className="h-4 w-4 text-white/40" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all duration-300"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Selection */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Theme Preference</h2>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        Choose your preferred theme appearance
                      </p>
                    </div>
                    <Palette className="h-8 w-8 text-[#fd297b]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'light' as const, name: 'Light', icon: Sun, description: 'Bright and clean interface', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-gradient-to-br from-yellow-400 to-orange-400' },
                      { id: 'dark' as const, name: 'Dark', icon: Moon, description: 'Easy on the eyes, great for night', color: 'from-slate-600 to-slate-800', bgColor: 'bg-gradient-to-br from-slate-700 to-slate-900' },
                      { id: 'system' as const, name: 'System', icon: Monitor, description: 'Follow your device settings', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-500' }
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`p-5 rounded-xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl group ${
                          selectedTheme === theme.id 
                            ? `ring-2 ring-[#fd297b] shadow-lg ${isDark ? 'bg-white/15' : 'bg-white/80'}`
                            : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      >
                        <div className={`${theme.bgColor} w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                          <theme.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {theme.name}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                          {theme.description}
                        </p>
                        {selectedTheme === theme.id && (
                          <div className="mt-3 flex justify-center">
                            <div className="h-2 w-2 rounded-full bg-[#fd297b] ring-2 ring-[#fd297b]/30" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white/50 text-slate-700 hover:bg-white/70'
              }`}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                {saved ? <Check className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className={`rounded-2xl p-6 border-2 border-red-500/30 transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-white/5' : 'bg-white/40'}`}>
              <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Danger Zone
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
}