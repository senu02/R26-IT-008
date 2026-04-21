// app/admin/settings/page.tsx (Updated with Space Theme)
'use client';

import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Shield,
  Bell,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  Database,
  Palette,
  Volume2,
  Eye,
  Laptop,
  Save,
  CheckCircle,
  Fingerprint,
  Settings as SettingsIcon,
  Sparkles,
  Rocket
} from 'lucide-react';
import { useThemeColors, type ThemeMode } from '@/context/adminTheme';

export default function SettingsPage() {
  const { theme, colors, setTheme } = useThemeColors();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="space-y-6 relative" style={{ 
      backgroundColor: colors.background.primary, 
      minHeight: '100vh',
      ...(theme === 'space' && {
        backgroundImage: `radial-gradient(circle at 10% 20%, ${colors.primary.main}10 2px, transparent 2px), radial-gradient(circle at 90% 80%, ${colors.secondary.main}10 1px, transparent 1px)`,
        backgroundSize: '50px 50px, 30px 30px'
      })
    }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Settings</h1>
        <p className="mt-1" style={{ color: colors.text.secondary }}>Manage your account settings and preferences</p>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg" style={{ backgroundColor: colors.status.success, color: 'white' }}>
            <CheckCircle size={18} />
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? `${colors.primary.main}15` : 'transparent',
                color: activeTab === tab.id ? colors.primary.main : colors.text.secondary,
                borderLeft: activeTab === tab.id ? `3px solid ${colors.primary.main}` : '3px solid transparent'
              }}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="rounded-xl border p-6 transition-all duration-300" style={{ 
                backgroundColor: colors.surface.primary, 
                borderColor: colors.border.primary,
                ...(theme === 'space' && {
                  boxShadow: `0 0 20px ${colors.primary.main}10`,
                })
              }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Theme Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Light Theme */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light' ? 'border-indigo-500' : 'border-transparent'}`}
                    style={{ backgroundColor: colors.background.secondary }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fbbf24' }}>
                        <Sun size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.text.primary }}>Light Mode</p>
                        <p className="text-xs" style={{ color: colors.text.tertiary }}>Bright and clean</p>
                      </div>
                      {theme === 'light' && <CheckCircle size={20} style={{ color: colors.primary.main }} />}
                    </div>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'dark' ? 'border-indigo-500' : 'border-transparent'}`}
                    style={{ backgroundColor: colors.background.secondary }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
                        <Moon size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.text.primary }}>Dark Mode</p>
                        <p className="text-xs" style={{ color: colors.text.tertiary }}>Easy on the eyes</p>
                      </div>
                      {theme === 'dark' && <CheckCircle size={20} style={{ color: colors.primary.main }} />}
                    </div>
                  </button>

                  {/* Space Theme - NEW */}
                  <button
                    onClick={() => setTheme('space')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${theme === 'space' ? 'border-purple-500' : 'border-transparent'}`}
                    style={{ backgroundColor: theme === 'space' ? '#0d1425' : colors.background.secondary }}
                  >
                    {/* Space background effect */}
                    <div className="absolute inset-0 opacity-30" style={{
                      background: 'radial-gradient(circle at 20% 30%, #8b5cf6 0%, transparent 50%), radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 50%)'
                    }} />
                    <div className="flex flex-col items-center gap-3 relative z-10">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' }}>
                        <Rocket size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: colors.text.primary }}>Space Theme</p>
                        <p className="text-xs" style={{ color: colors.text.tertiary }}>Cosmic experience</p>
                      </div>
                      {theme === 'space' && <CheckCircle size={20} style={{ color: colors.primary.main }} />}
                    </div>
                    
                    {/* Twinkling stars effect for space theme preview */}
                    {theme === 'space' && (
                      <>
                        <div className="absolute top-2 right-2 w-1 h-1 bg-yellow-300 rounded-full animate-pulse" />
                        <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-white rounded-full" />
                        <div className="absolute top-1/2 right-4 w-0.5 h-0.5 bg-white rounded-full animate-ping" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* System Default Button Section */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>System Preference</h2>
                <button
                  onClick={() => {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    setTheme(systemTheme);
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200`}
                  style={{ 
                    backgroundColor: colors.background.secondary,
                    borderColor: theme !== 'light' && theme !== 'dark' && theme !== 'space' ? colors.primary.main : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                        <Monitor size={24} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium" style={{ color: colors.text.primary }}>Use System Default</p>
                        <p className="text-xs" style={{ color: colors.text.tertiary }}>Automatically follow your device theme preference</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Theme Preview */}
              <div className="rounded-xl border p-6 overflow-hidden" style={{ 
                backgroundColor: colors.surface.primary, 
                borderColor: colors.border.primary,
                ...(theme === 'space' && {
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at 20% 40%, ${colors.primary.main}10 0%, transparent 50%)`,
                    pointerEvents: 'none'
                  }
                })
              }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Live Preview</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg transition-all duration-300" style={{ 
                    backgroundColor: colors.background.secondary,
                    ...(theme === 'space' && {
                      backdropFilter: 'blur(2px)',
                    })
                  }}>
                    <p className="font-medium" style={{ color: colors.text.primary }}>Sample text with current theme</p>
                    <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>Secondary text example</p>
                    <div className="flex gap-3 mt-3">
                      <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ backgroundColor: colors.primary.main, color: 'white' }}>
                        Primary Button
                      </button>
                      <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all border" style={{ borderColor: colors.border.primary, color: colors.text.secondary }}>
                        Secondary Button
                      </button>
                    </div>
                    
                    {/* Space theme special effects preview */}
                    {theme === 'space' && (
                      <div className="mt-4 flex gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                        <div className="w-1 h-1 bg-yellow-300 rounded-full" />
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="rounded-xl border p-6" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Profile Information</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.text.secondary }}>Full Name</label>
                    <input
                      type="text"
                      defaultValue="Admin User"
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.text.secondary }}>Email Address</label>
                    <input
                      type="email"
                      defaultValue="admin@example.com"
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.text.secondary }}>Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 234 567 8900"
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: colors.text.secondary }}>Location</label>
                    <input
                      type="text"
                      defaultValue="New York, USA"
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="rounded-xl border p-6" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', description: 'Receive email notifications about your account', enabled: true },
                  { label: 'Push Notifications', description: 'Get push notifications on your browser', enabled: true },
                  { label: 'Weekly Digest', description: 'Receive weekly summary of activities', enabled: false },
                  { label: 'Marketing Updates', description: 'Get updates about new features and offers', enabled: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg transition-all" style={{ backgroundColor: colors.background.secondary }}>
                    <div>
                      <p className="font-medium" style={{ color: colors.text.primary }}>{item.label}</p>
                      <p className="text-xs" style={{ color: colors.text.tertiary }}>{item.description}</p>
                    </div>
                    <button
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: item.enabled ? colors.primary.main : colors.border.secondary }}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="rounded-xl border p-6" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Two-Factor Authentication</h2>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primary.main}20`, color: colors.primary.main }}>
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: colors.text.primary }}>Enable 2FA</p>
                    <p className="text-xs" style={{ color: colors.text.tertiary }}>Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:scale-105"
                  style={{ backgroundColor: colors.primary.main, color: 'white' }}
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary.main, color: 'white' }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Space theme floating particles effect */}
      {theme === 'space' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`,
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's',
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}