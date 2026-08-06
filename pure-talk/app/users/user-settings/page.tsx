// app/users/user-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
import { ToastProvider, useToast } from '@/context/userToast';
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

// Instagram-esque story-ring gradient, used sparingly as the single accent
const IG_GRADIENT = 'linear-gradient(45deg, #F9CE34 0%, #EE2A7B 55%, #6228D7 100%)';
const IG_BLUE = '#0095F6';

export default function UserSettingsPage() {
  return (
    <ToastProvider>
      <UserSettingsContent />
    </ToastProvider>
  );
}

function UserSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
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
  const [error, setError] = useState<string | null>(null);

  // Avatar used in the Instagram-style toast, same idea as StoryRow's myAvatar
  const myAvatar = previewProfilePicture
    || getImageUrl(user?.profile_picture)
    || `https://ui-avatars.com/api/?background=262626&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`;

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
    setError(null);

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

      // Instagram-style toast with profile image, same pattern as StoryRow
      toast.showInstagramToast(
        'updated their profile ✨',
        updatedUser?.full_name || formData.full_name || 'You',
        myAvatar,
        'like'
      );

      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaved(false);
      setError(err?.message || 'Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    setError(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    try {
      if (user) {
        await authAPI.changePassword(user.id, passwordData);

        // Instagram-style toast with profile image, same pattern as StoryRow
        toast.showInstagramToast(
          'changed their password 🔒',
          user?.full_name || 'You',
          myAvatar,
          'like'
        );

        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        // Optionally logout and redirect to login
        // await authAPI.logout();
        // router.push('/login');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    const password = prompt('Please enter your password to confirm account deletion:');
    if (password) {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        try {
          await authAPI.deleteAccount(password);

          // Instagram-style toast with profile image, same pattern as StoryRow
          toast.showInstagramToast(
            'deleted their account 👋',
            user?.full_name || 'You',
            myAvatar,
            'like'
          );

          router.push('/login');
        } catch (err: any) {
          console.error('Error deleting account:', err);
          setError(err?.message || 'Failed to delete account');
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

  // Shared style fragments so the IG look stays consistent everywhere
  const cardClass = isDark
    ? 'bg-[#121212] border border-[#262626]'
    : 'bg-white border border-[#DBDBDB]';

  const inputClass = (extra = '') =>
    `w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors border ${
      isDark
        ? 'bg-[#121212] text-white border-[#363636] placeholder-[#8e8e8e] focus:border-white'
        : 'bg-[#FAFAFA] text-[#262626] border-[#DBDBDB] placeholder-[#8e8e8e] focus:border-[#a8a8a8]'
    } ${extra}`;

  const labelClass = `block text-xs font-semibold uppercase tracking-wide mb-2 ${
    isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'
  }`;

  if (loading) {
    return (
      <BackgroundWrapper isDark={isDark}>
        <Sidebar />
        <div className="flex-1 lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto"
              style={{ borderImage: `${IG_GRADIENT} 1` }}
            ></div>
            <p className={`mt-4 text-sm ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>Loading settings…</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper isDark={isDark}>
      <Sidebar />

      <div className={`flex-1 lg:ml-72 min-h-screen ${isDark ? 'bg-black' : 'bg-[#FAFAFA]'}`}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          <div className="lg:hidden h-12"></div>

          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
              Settings
            </h1>
            <p className={`mt-3 text-base ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>
              Manage your account and how you appear on the app
            </p>
          </div>

          {error && (
            <p className="mb-4 px-1 text-center text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Underline-style tabs, à la Instagram profile nav */}
          <div className={`flex gap-6 mb-8 border-b ${isDark ? 'border-[#262626]' : 'border-[#DBDBDB]'}`}>
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex items-center gap-1.5 pb-3 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                activeSection === 'profile'
                  ? (isDark ? 'border-white text-white' : 'border-[#262626] text-[#262626]')
                  : 'border-transparent text-[#8e8e8e] hover:text-[#737373]'
              }`}
            >
              <Users className="h-4 w-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveSection('appearance')}
              className={`flex items-center gap-1.5 pb-3 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                activeSection === 'appearance'
                  ? (isDark ? 'border-white text-white' : 'border-[#262626] text-[#262626]')
                  : 'border-transparent text-[#8e8e8e] hover:text-[#737373]'
              }`}
            >
              <Palette className="h-4 w-4" />
              Appearance
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-5">
                {/* Avatar + Cover combined card, like an IG profile edit sheet */}
                <div className={`rounded-xl overflow-hidden ${cardClass}`}>
                  <div className="relative h-40">
                    <img
                      src={previewCoverImage || getImageUrl(user?.cover_image) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <label className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer backdrop-blur-sm ${
                      isDark ? 'bg-black/60 text-white' : 'bg-white/80 text-[#262626]'
                    }`}>
                      <Camera className="h-3.5 w-3.5" />
                      Change cover
                      <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                    </label>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-12 md:-mt-14">
                      <div className="relative">
                        {/* Gradient story-ring, the one intentional accent */}
                        <div className="p-[3px] rounded-full" style={{ background: IG_GRADIENT }}>
                          <div className={`p-[2px] rounded-full ${isDark ? 'bg-black' : 'bg-white'}`}>
                            <img
                              src={previewProfilePicture || getImageUrl(user?.profile_picture) || `https://ui-avatars.com/api/?background=262626&color=fff&size=128&name=${encodeURIComponent(user?.full_name || 'User')}`}
                              alt="Profile"
                              className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover"
                            />
                          </div>
                        </div>
                        <label className={`absolute bottom-0 right-0 rounded-full p-2 border-2 cursor-pointer ${
                          isDark ? 'bg-[#0095F6] border-black' : 'bg-[#0095F6] border-white'
                        }`}>
                          <Camera className="h-3.5 w-3.5 text-white" />
                          <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                        </label>
                      </div>
                      <div className="pb-1">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                          {formData.full_name || 'Your name'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>
                          JPG, GIF or PNG · Max 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Info Card */}
                <div className={`rounded-xl p-6 ${cardClass}`}>
                  <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    Personal information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className={inputClass()}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={inputClass()}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone number</label>
                      <input
                        type="tel"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        className={inputClass()}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={inputClass()}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Bio</label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className={inputClass('resize-none')}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change Card */}
                <div className={`rounded-xl p-6 ${cardClass}`}>
                  <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    Change password
                  </h2>
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <label className={labelClass}>Current password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                          className={inputClass('pr-10')}
                          placeholder="Enter current password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          type="button"
                        >
                          {showPassword
                            ? <EyeOff className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />
                            : <Eye className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>New password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className={inputClass('pr-10')}
                          placeholder="Enter new password"
                        />
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          type="button"
                        >
                          {showNewPassword
                            ? <EyeOff className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />
                            : <Eye className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Confirm new password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className={inputClass('pr-10')}
                          placeholder="Confirm new password"
                        />
                        <button
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          type="button"
                        >
                          {showConfirmPassword
                            ? <EyeOff className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />
                            : <Eye className={`h-4 w-4 ${isDark ? 'text-[#8e8e8e]' : 'text-[#a8a8a8]'}`} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: IG_BLUE }}
                    >
                      Update password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-5">
                <div className={`rounded-xl p-6 ${cardClass}`}>
                  <h2 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                    Theme
                  </h2>
                  <p className={`text-xs mb-5 ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>
                    Choose how the app looks on this device
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'light' as const, name: 'Light', icon: Sun, description: 'Bright and clean' },
                      { id: 'dark' as const, name: 'Dark', icon: Moon, description: 'Easy on the eyes' },
                      { id: 'system' as const, name: 'System', icon: Monitor, description: 'Match your device' }
                    ].map((theme) => {
                      const active = selectedTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={`p-4 rounded-lg text-left transition-colors border ${
                            active
                              ? (isDark ? 'border-white' : 'border-[#262626]')
                              : (isDark ? 'border-[#262626] hover:border-[#363636]' : 'border-[#DBDBDB] hover:border-[#a8a8a8]')
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className="h-16 w-16 rounded-full flex items-center justify-center"
                              style={active ? { background: IG_GRADIENT } : {}}
                            >
                              <theme.icon
                                className={`h-7 w-7 ${active ? 'text-white' : (isDark ? 'text-[#a8a8a8]' : 'text-[#737373]')}`}
                              />
                            </div>
                            {active && <Check className="h-4 w-4" style={{ color: IG_BLUE }} />}
                          </div>
                          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#262626]'}`}>
                            {theme.name}
                          </h3>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>
                            {theme.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isDark ? 'text-[#a8a8a8] hover:text-white' : 'text-[#737373] hover:text-[#262626]'
              }`}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: IG_BLUE }}
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? 'Saved' : 'Save changes'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-[#121212] border-[#4a1414]' : 'bg-white border-[#f5b5b5]'}`}>
              <h3 className="text-sm font-semibold text-[#ED4956] mb-1 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Danger zone
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-[#a8a8a8]' : 'text-[#737373]'}`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#ED4956] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </button>
                <button className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#ED4956] text-[#ED4956] hover:bg-[#ED4956] hover:text-white transition-colors flex items-center gap-1.5">
                  <LogOut className="h-3.5 w-3.5" />
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