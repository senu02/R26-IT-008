// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

export type User = {
  id: number;
  full_name: string;
  profile_picture?: string | null;
  email?: string;
  username?: string;
};

export type Story = {
  id: number;
  user: number;
  user_id: number;
  image: string;
  image_url: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
};

export type StoryFeedItem = Story;

// Authentication functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};

export const getCurrentUserData = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return PLACEHOLDER_AVATAR;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/media/')) {
    return `${API_BASE_URL}${path}`;
  }
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/media/${path}`;
};

// API call function with authentication
export const apiCall = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('API calls can only be made on the client side');
  }

  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.assign(headers, customHeaders);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorData.detail || 'An error occurred';
    } catch (e) {
      const text = await response.text();
      errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
};

// Story-specific API functions
export const storyApi = {
  // Get feed stories
  getFeed: async (): Promise<StoryFeedItem[]> => {
    try {
      const data = await apiCall('/api/stories/feed/');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching feed stories:', error);
      throw error;
    }
  },

  // Upload a story
  upload: async (file: File): Promise<Story> => {
    const formData = new FormData();
    formData.append('image', file);
    
    return await apiCall('/api/stories/', {
      method: 'POST',
      body: formData,
    });
  },

  // Delete a story
  delete: async (storyId: number): Promise<void> => {
    await apiCall(`/api/stories/${storyId}/`, { 
      method: 'DELETE' 
    });
  },

  // Get user's stories
  getUserStories: async (userId: number): Promise<StoryFeedItem[]> => {
    const data = await apiCall(`/api/stories/user/${userId}/`);
    return Array.isArray(data) ? data : [];
  },
};

// Helper functions for stories
export const storyHelpers = {
  getDisplayName: (story: StoryFeedItem): string => {
    return story.author_name || 'User';
  },

  getAvatar: (story: StoryFeedItem): string => {
    if (story.author_avatar) {
      if (story.author_avatar.startsWith('http')) {
        return story.author_avatar;
      }
      return getImageUrl(story.author_avatar) || PLACEHOLDER_AVATAR;
    }
    return PLACEHOLDER_AVATAR;
  },

  getStoryImage: (story: StoryFeedItem): string => {
    const imageUrl = story.image_url || story.image;
    if (!imageUrl) return 'https://picsum.photos/800/1200';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return getImageUrl(imageUrl) || imageUrl;
  },

  getUserStories: (stories: StoryFeedItem[], userId: number): StoryFeedItem[] => {
    return stories.filter(s => s.user === userId || s.user_id === userId);
  },

  groupStoriesByUser: (stories: StoryFeedItem[], currentUserId?: number): { userId: number; stories: StoryFeedItem[] }[] => {
    const uniqueUsers = new Set<number>();
    const userStoryGroups: { userId: number; stories: StoryFeedItem[] }[] = [];
    
    stories.forEach(story => {
      const userId = story.user || story.user_id;
      if (userId !== currentUserId && !uniqueUsers.has(userId)) {
        uniqueUsers.add(userId);
        const userStories = stories.filter(s => (s.user === userId || s.user_id === userId));
        userStoryGroups.push({ userId, stories: userStories });
      }
    });

    return userStoryGroups;
  },
};

export { API_BASE_URL, PLACEHOLDER_AVATAR };