// app/admin/dashboard/profile/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { authAPI, userAPI, getCurrentUserData } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Define the user data structure matching Django backend
interface UserData {
  id?: string | number;
  full_name?: string | null;
  email?: string;
  mobile_number?: string | null;
  city?: string | null;
  country?: string | null;
  role?: string;
  date_joined?: string;
  bio?: string | null;
  website?: string | null;
  work?: string | null;
  education?: string | null;
  relationship_status?: string | null;
  birthday?: string | null;
  gender?: string | null;
  profile_picture?: string | null;
  cover_image?: string | null;
  account_status?: string;
  last_active?: string;
  age?: number | null;
  display_name?: string;
  is_admin?: boolean;
  is_moderator?: boolean;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  joinDate: string;
  bio: string;
  website: string;
  work: string;
  education: string;
  relationship_status: string;
  birthday: string;
  gender: string;
  profile_picture: string | null;
}

interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
}

interface StatsData {
  label: string;
  value: string;
  icon: null;
}

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    weeklyDigest: false,
    securityAlerts: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData[]>([
    { label: 'Projects Managed', value: '0', icon: null },
    { label: 'Team Members', value: '0', icon: null },
    { label: 'Years Active', value: '0', icon: null },
    { label: 'Tasks Completed', value: '0', icon: null },
  ]);

  // Fetch profile data from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await authAPI.getCurrentUser() as UserData;
      
      console.log('Fetched user data:', userData);
      console.log('Profile picture path:', userData.profile_picture);
      
      // Transform backend data to match frontend format
      const locationParts = [];
      if (userData.city) locationParts.push(userData.city);
      if (userData.country) locationParts.push(userData.country);
      
      const transformedData: ProfileData = {
        name: userData.full_name || userData.display_name || userData.email?.split('@')[0] || 'User',
        email: userData.email || '',
        phone: userData.mobile_number || '',
        location: locationParts.join(', ') || 'Not set',
        role: userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User',
        joinDate: userData.date_joined ? new Date(userData.date_joined).toLocaleDateString() : new Date().toLocaleDateString(),
        bio: userData.bio || '',
        website: userData.website || '',
        work: userData.work || '',
        education: userData.education || '',
        relationship_status: userData.relationship_status || '',
        birthday: userData.birthday || '',
        gender: userData.gender || '',
        profile_picture: userData.profile_picture || null,
      };
      
      setProfileData(transformedData);
      
      // Set profile picture URL
      const imageUrl = getFullImageUrl(userData.profile_picture);
      setProfilePictureUrl(imageUrl);
      
      // Try to fetch user stats (admin only)
      try {
        const userStats = await userAPI.getUserStats() as any;
        if (userStats) {
          setStats([
            { label: 'Total Users', value: userStats.total_users?.toString() || '0', icon: null },
            { label: 'Active Users', value: userStats.active_users?.toString() || '0', icon: null },
            { label: 'Suspended', value: userStats.suspended_users?.toString() || '0', icon: null },
            { label: 'Banned', value: userStats.banned_users?.toString() || '0', icon: null },
          ]);
        }
      } catch (statsErr) {
        console.log('Stats not available or insufficient permissions:', statsErr);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile data');
      
      // Fallback to localStorage data
      const localUserData = getCurrentUserData() as UserData | null;
      if (localUserData) {
        const locationParts = [];
        if (localUserData.city) locationParts.push(localUserData.city);
        if (localUserData.country) locationParts.push(localUserData.country);
        
        const transformedData: ProfileData = {
          name: localUserData.full_name || localUserData.display_name || localUserData.email?.split('@')[0] || 'User',
          email: localUserData.email || '',
          phone: localUserData.mobile_number || '',
          location: locationParts.join(', ') || 'Not set',
          role: localUserData.role ? localUserData.role.charAt(0).toUpperCase() + localUserData.role.slice(1) : 'User',
          joinDate: localUserData.date_joined ? new Date(localUserData.date_joined).toLocaleDateString() : new Date().toLocaleDateString(),
          bio: localUserData.bio || '',
          website: localUserData.website || '',
          work: localUserData.work || '',
          education: localUserData.education || '',
          relationship_status: localUserData.relationship_status || '',
          birthday: localUserData.birthday || '',
          gender: localUserData.gender || '',
          profile_picture: localUserData.profile_picture || null,
        };
        setProfileData(transformedData);
        setProfilePictureUrl(getFullImageUrl(localUserData.profile_picture));
      }
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updatedData: ProfileData) => {
    try {
      setLoading(true);
      
      // Transform frontend data to backend format
      const locationParts = updatedData.location.split(',').map(part => part.trim());
      const backendData: any = {
        full_name: updatedData.name,
        email: updatedData.email,
        mobile_number: updatedData.phone,
        bio: updatedData.bio,
        website: updatedData.website,
        work: updatedData.work,
        education: updatedData.education,
        relationship_status: updatedData.relationship_status,
        birthday: updatedData.birthday || null,
        gender: updatedData.gender || null
      };
      
      // Only add location fields if they exist
      if (locationParts[0] && locationParts[0] !== 'Not set') backendData.city = locationParts[0];
      if (locationParts[1]) backendData.country = locationParts[1];
      
      const response = await authAPI.updateProfile(backendData);
      
      // Update local state
      setProfileData(updatedData);
      
      // Update localStorage
      const localUser = getCurrentUserData() as UserData | null;
      if (localUser) {
        const updatedLocalUser = { ...localUser, ...backendData };
        localStorage.setItem('user_data', JSON.stringify(updatedLocalUser));
      }
      
      // Refresh profile data to get updated values
      await fetchProfile();
      
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update notification settings
  const updateNotifications = async (updatedNotifications: NotificationSettings) => {
    try {
      const response = await authAPI.updateProfile({
        notification_settings: updatedNotifications
      });
      
      setNotifications(updatedNotifications);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error updating notifications:', err);
      setError(err.message || 'Failed to update notification settings');
      return { success: false, error: err.message };
    }
  };

  // Change password
  const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const userData = getCurrentUserData() as UserData | null;
      const userId = userData?.id;
      
      if (!userId) throw new Error('User not found');
      
      const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      if (isNaN(numericUserId)) {
        throw new Error('Invalid user ID');
      }
      
      const response = await userAPI.changePassword(numericUserId, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error changing password:', err);
      return { success: false, error: err.message || 'Failed to change password' };
    }
  };

  // Delete account
  const deleteAccount = async (password: string) => {
    try {
      const response = await authAPI.deleteAccount(password);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error deleting account:', err);
      return { success: false, error: err.message || 'Failed to delete account' };
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await authAPI.updateProfile(formData);
      
      // Refresh profile data to get updated picture URL
      await fetchProfile();
      
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      return { success: false, error: err.message || 'Failed to upload image' };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profileData,
    profilePictureUrl,
    notifications,
    stats,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateNotifications,
    changePassword,
    deleteAccount,
    uploadProfilePicture
  };
};