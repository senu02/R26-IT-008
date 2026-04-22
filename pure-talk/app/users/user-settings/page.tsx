// app/users/user-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
import {
  User,
  Lock,
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

export default function UserSettingsPage() {
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');

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
    return () => observer.disconnect();
  }, []);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      setShowTwoFactorSetup(true);
    } else {
      setTwoFactorEnabled(false);
    }
  };

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
                          src="https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Nathan+Garcia"
                          alt="Profile"
                          className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover"
                        />
                      </div>
                      <button className="absolute bottom-0 right-0 rounded-full p-2 bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-lg hover:scale-110 transition-all duration-300">
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all duration-300 hover:scale-105">
                        Upload New Photo
                      </button>
                      <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        JPG, GIF or PNG. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Personal Information</h2>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
                        <Link2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        <User className="inline h-3.5 w-3.5 mr-1" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Nathan Garcia"
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
                        defaultValue="nathan.garcia@example.com"
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
                        defaultValue="+1 234 567 8900"
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
                        defaultValue="San Francisco, CA"
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
                        defaultValue="UI/UX Designer with 8+ years of experience in creating digital products that are both functional and aesthetically pleasing. Passionate about user-centered design and emerging technologies."
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 group-hover:scale-[1.01] ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                      />
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication Card */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</h2>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-[#fd297b]" />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                        <Key className={`h-5 w-5 ${twoFactorEnabled ? 'text-green-500' : 'text-yellow-500'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                          {twoFactorEnabled 
                            ? 'Your account is protected with 2FA' 
                            : 'Enable 2FA to secure your account'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTwoFactorToggle}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        twoFactorEnabled
                          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                          : 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white'
                      }`}
                    >
                      {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {/* 2FA Setup Modal */}
                  {showTwoFactorSetup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                      <div className={`relative max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-black/90 border border-white/20' : 'bg-white border border-slate-200'} shadow-2xl animate-in zoom-in duration-300`}>
                        <button
                          onClick={() => setShowTwoFactorSetup(false)}
                          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        
                        <div className="text-center mb-6">
                          <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-[#fd297b]/20 to-[#ff655b]/20 mb-4">
                            <QrCode className="h-8 w-8 text-[#fd297b]" />
                          </div>
                          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Set Up Two-Factor Authentication
                          </h3>
                          <p className={`text-sm mt-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                            Scan the QR code with your authenticator app
                          </p>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="flex justify-center mb-6">
                          <div className="w-48 h-48 bg-gradient-to-br from-[#fd297b] to-[#ff655b] rounded-xl flex items-center justify-center shadow-lg">
                            <QrCode className="h-24 w-24 text-white opacity-80" />
                          </div>
                        </div>

                        {/* Setup Code */}
                        <div className={`mb-6 p-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                          <p className={`text-center font-mono text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            2FA8 9G3K 7H2L 5M4N 6P1Q 8R2S
                          </p>
                        </div>

                        {/* Verification Input */}
                        <div className="mb-6">
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                            Verification Code
                          </label>
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                              isDark 
                                ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                                : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                            } border`}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowTwoFactorSetup(false)}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setTwoFactorEnabled(true);
                              setShowTwoFactorSetup(false);
                              handleSave();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white hover:opacity-90 transition-all"
                          >
                            Verify & Enable
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                      <input
                        type="password"
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Confirm New Password</label>
                      <input
                        type="password"
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20' 
                            : 'bg-white/60 text-slate-900 border-white/50 focus:border-[#fd297b] focus:ring-2 focus:ring-[#fd297b]/20'
                        } border`}
                        placeholder="Confirm new password"
                      />
                    </div>
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

                {/* Display Options */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Display Options</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Compact Mode', desc: 'Show more content with tighter spacing', icon: Zap, enabled: false },
                      { label: 'Reduced Motion', desc: 'Minimize animations and transitions', icon: Eye, enabled: false },
                      { label: 'Large Fonts', desc: 'Increase text size for better readability', icon: FileText, enabled: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/10 transition-all duration-300 hover:translate-x-1">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-[#fd297b]" />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{item.desc}</p>
                          </div>
                        </div>
                        <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${item.enabled ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b]' : isDark ? 'bg-white/20' : 'bg-white/50'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animation Preferences */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${isDark ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-white/40 backdrop-blur-md border border-white/50'}`}>
                  <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Animation Preferences</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5' : 'bg-white/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Page Transitions</span>
                        <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${isDark ? 'bg-white/20' : 'bg-white/50'}`}>
                          <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-300 translate-x-1" />
                        </button>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Smooth animations between pages</p>
                    </div>
                    <div className={`p-4 rounded-xl transition-all duration-300 ${isDark ? 'bg-white/5' : 'bg-white/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Hover Effects</span>
                        <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 bg-gradient-to-r from-[#fd297b] to-[#ff655b]`}>
                          <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-300 translate-x-4" />
                        </button>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Interactive hover animations</p>
                    </div>
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
                <button className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-105 flex items-center gap-2">
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