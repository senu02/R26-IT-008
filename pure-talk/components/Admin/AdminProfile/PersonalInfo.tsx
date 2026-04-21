// app/admin/dashboard/profile/components/PersonalInfo.tsx
'use client';

import React from 'react';
import { useThemeColors } from '@/context/adminTheme';

interface PersonalInfoFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  birthday: string;
  gender: string;
  bio: string;
}

interface PersonalInfoProps {
  formData: PersonalInfoFormData;
  profileData: {
    name: string;
    email: string;
    phone: string;
    location: string;
    birthday: string;
    gender: string;
    bio: string;
  } | null | undefined;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function PersonalInfo({ 
  formData, 
  profileData, 
  isEditing, 
  onInputChange 
}: PersonalInfoProps) {
  const { colors } = useThemeColors();

  const getValue = (field: keyof PersonalInfoFormData, defaultValue: string = 'Not set') => {
    return profileData?.[field] || defaultValue;
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.primary,
        borderWidth: 1
      }}
    >
      <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
              placeholder="Enter your full name"
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('name')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Email Address
          </label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
              placeholder="Enter your email address"
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('email')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
              placeholder="Enter your phone number"
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('phone')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Location
          </label>
          {isEditing ? (
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
              placeholder="Enter your location"
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('location')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Birthday
          </label>
          {isEditing ? (
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('birthday')}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Gender
          </label>
          {isEditing ? (
            <select
              name="gender"
              value={formData.gender}
              onChange={onInputChange}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="custom">Custom</option>
            </select>
          ) : (
            <p style={{ color: colors.text.primary }}>
              {profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not set'}
            </p>
          )}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm mb-2" style={{ color: colors.text.secondary }}>
            Bio
          </label>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={onInputChange}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
                color: colors.text.primary
              }}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p style={{ color: colors.text.primary }}>{getValue('bio')}</p>
          )}
        </div>
      </div>
    </div>
  );
}