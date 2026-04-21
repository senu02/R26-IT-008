// app/admin/dashboard/profile/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useThemeColors } from '@/context/adminTheme';
import { useProfile } from './actions';
import { useToast } from '@/context/toast';
import DangerZone from '@/components/Admin/AdminProfile/DangerZone';
import PersonalInfo from '@/components/Admin/AdminProfile/PersonalInfo';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Edit2, 
  Save, 
  X,
  Camera,
  Bell,
  Lock,
  Palette,
  Loader,
  Globe,
  GraduationCap,
  Heart,
  Cake,
  Users
} from 'lucide-react';

export default function AdminProfile() {
  const { colors, theme } = useThemeColors();
  const { showSuccess, showError } = useToast();
  const { 
    profileData, 
    profilePictureUrl,
    notifications, 
    stats, 
    loading, 
    error,
    updateProfile,
    updateNotifications,
    changePassword,
    deleteAccount,
    uploadProfilePicture
  } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    role: '',
    joinDate: '',
    bio: '',
    website: '',
    work: '',
    education: '',
    relationship_status: '',
    birthday: '',
    gender: '',
    profile_picture: null as string | null
  });

  // Update form data when profile data loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        role: profileData.role || '',
        joinDate: profileData.joinDate || '',
        bio: profileData.bio || '',
        website: profileData.website || '',
        work: profileData.work || '',
        education: profileData.education || '',
        relationship_status: profileData.relationship_status || '',
        birthday: profileData.birthday || '',
        gender: profileData.gender || '',
        profile_picture: profileData.profile_picture || null
      });
    }
  }, [profileData]);

  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (key: keyof typeof localNotifications) => {
    const updated = {
      ...localNotifications,
      [key]: !localNotifications[key]
    };
    setLocalNotifications(updated);
  };

  const handleSave = async () => {
    const updateData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      role: formData.role,
      joinDate: formData.joinDate,
      bio: formData.bio,
      website: formData.website,
      work: formData.work,
      education: formData.education,
      relationship_status: formData.relationship_status,
      birthday: formData.birthday,
      gender: formData.gender,
      profile_picture: formData.profile_picture
    };
    
    const result = await updateProfile(updateData);
    if (result.success) {
      setIsEditing(false);
      showSuccess('Profile updated successfully!');
    } else {
      showError(`Failed to update profile: ${result.error}`);
    }
  };

  const handleSaveNotifications = async () => {
    const result = await updateNotifications(localNotifications);
    if (result.success) {
      showSuccess('Notification settings updated successfully!');
    } else {
      showError(`Failed to update notifications: ${result.error}`);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    
    const result = await changePassword(
      passwordData.oldPassword,
      passwordData.newPassword,
      passwordData.confirmPassword
    );
    
    if (result.success) {
      showSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showError(`Failed to change password: ${result.error}`);
    }
  };

  const handleDeleteAccountWrapper = async (password: string) => {
    return await deleteAccount(password);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }
    
    setUploadingImage(true);
    const result = await uploadProfilePicture(file);
    setUploadingImage(false);
    
    if (result.success) {
      showSuccess('Profile picture updated successfully!');
      setImageError(false);
    } else {
      showError(`Failed to upload image: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center">
          <Loader size={48} className="animate-spin mx-auto mb-4" style={{ color: colors.primary.main }} />
          <p style={{ color: colors.text.secondary }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.primary }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.background.primary }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
              Profile Settings
            </h1>
            <p className="mt-1" style={{ color: colors.text.secondary }}>
              Manage your account settings and preferences
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: isEditing ? colors.status.error : colors.primary.main,
              color: colors.primary.contrast
            }}
          >
            {isEditing ? (
              <>
                <X size={18} />
                Cancel
              </>
            ) : (
              <>
                <Edit2 size={18} />
                Edit Profile
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.primary,
                borderWidth: 1
              }}
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {profilePictureUrl && !imageError ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                      <Image
                        src={profilePictureUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                        unoptimized={true}
                      />
                      {uploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <Loader size={24} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-4 relative overflow-hidden"
                      style={{
                        background: colors.gradient.primary,
                        color: colors.primary.contrast
                      }}
                    >
                      {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                      {uploadingImage && (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-50">
                          <Loader size={24} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isEditing && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 right-0 p-2 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.primary.contrast
                        }}
                        disabled={uploadingImage}
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  {profileData?.name || 'User Name'}
                </h2>
                <p className="mb-4" style={{ color: colors.text.secondary }}>
                  {profileData?.role || 'User Role'}
                </p>
                <div
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: colors.primary.light + '20',
                    color: colors.primary.main
                  }}
                >
                  Member since {profileData?.joinDate || 'Unknown'}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3" style={{ color: colors.text.secondary }}>
                  <Mail size={18} />
                  <span className="text-sm">{profileData?.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: colors.text.secondary }}>
                  <Phone size={18} />
                  <span className="text-sm">{profileData?.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: colors.text.secondary }}>
                  <MapPin size={18} />
                  <span className="text-sm">{profileData?.location || 'No location'}</span>
                </div>
                {profileData?.birthday && (
                  <div className="flex items-center gap-3" style={{ color: colors.text.secondary }}>
                    <Cake size={18} />
                    <span className="text-sm">{profileData.birthday}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: colors.surface.primary,
                    borderColor: colors.border.primary,
                    borderWidth: 1
                  }}
                >
                  <Users size={24} style={{ color: colors.primary.main }} />
                  <div className="mt-2">
                    <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                      {stat.value}
                    </div>
                    <div className="text-sm" style={{ color: colors.text.secondary }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Component */}
            <PersonalInfo
              formData={{
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                birthday: formData.birthday,
                gender: formData.gender,
                bio: formData.bio
              }}
              profileData={profileData}
              isEditing={isEditing}
              onInputChange={handleInputChange}
            />

            {/* Professional Info */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.primary,
                borderWidth: 1
              }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
                    <Briefcase size={16} className="inline mr-2" />
                    Work
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="work"
                      value={formData.work}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                      placeholder="Your job title or company"
                    />
                  ) : (
                    <p style={{ color: colors.text.primary }}>{profileData?.work || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
                    <GraduationCap size={16} className="inline mr-2" />
                    Education
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                      placeholder="Your school or university"
                    />
                  ) : (
                    <p style={{ color: colors.text.primary }}>{profileData?.education || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
                    <Heart size={16} className="inline mr-2" />
                    Relationship Status
                  </label>
                  {isEditing ? (
                    <select
                      name="relationship_status"
                      value={formData.relationship_status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    >
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="in_relationship">In a Relationship</option>
                      <option value="engaged">Engaged</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  ) : (
                    <p style={{ color: colors.text.primary }}>
                      {profileData?.relationship_status ? profileData.relationship_status.replace('_', ' ').charAt(0).toUpperCase() + profileData.relationship_status.slice(1) : 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
                    <Globe size={16} className="inline mr-2" />
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                      placeholder="https://your-website.com"
                    />
                  ) : (
                    <p style={{ color: colors.text.primary }}>
                      {profileData?.website ? (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary.main }}>
                          {profileData.website}
                        </a>
                      ) : 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.primary,
                borderWidth: 1
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={20} style={{ color: colors.primary.main }} />
                  <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Notification Preferences
                  </h3>
                </div>
                <button
                  onClick={handleSaveNotifications}
                  className="px-3 py-1 rounded-lg text-sm transition-all hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.primary.contrast
                  }}
                >
                  Save Settings
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(localNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span style={{ color: colors.text.secondary }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <div
                      onClick={() => handleNotificationChange(key as keyof typeof localNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        value ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Security & Theme Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: colors.surface.primary,
                  borderColor: colors.border.primary,
                  borderWidth: 1
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={20} style={{ color: colors.primary.main }} />
                  <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Security
                  </h3>
                </div>
                {!isChangingPassword ? (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: colors.primary.main + '20',
                      color: colors.primary.main
                    }}
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-90"
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.primary.contrast
                        }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-90"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: colors.border.primary,
                          borderWidth: 1,
                          color: colors.text.secondary
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: colors.surface.primary,
                  borderColor: colors.border.primary,
                  borderWidth: 1
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={20} style={{ color: colors.primary.main }} />
                  <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                    Theme
                  </h3>
                </div>
                <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                  Current theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </p>
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  Use the theme toggle in the sidebar to change themes
                </p>
              </div>
            </div>

            {/* Danger Zone Component */}
            <DangerZone onDeleteAccount={handleDeleteAccountWrapper} />

            {/* Action Buttons when editing */}
            {isEditing && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.border.primary,
                    borderWidth: 1,
                    color: colors.text.secondary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.primary.contrast
                  }}
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}