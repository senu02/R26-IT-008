// app/lib/videoActions.ts
import { getCurrentUserData } from '@/lib/api';

// Base API URL - make sure this matches your Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for video API calls
async function videoApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        data: errorData,
        message: errorData.error || errorData.message || 'An error occurred',
      };
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Helper to get full media URL
export const getFullMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Django serves media files under /media/
  return `${API_BASE_URL}${path}`;
};

// Types
export interface Video {
  id: number;
  user: number;
  user_details: {
    id: number;
    email: string;
    role: string;
    full_name?: string;
    profile_picture?: string;
  };
  title: string;
  description: string;
  video_file: string;
  video_url: string;
  thumbnail: string | null;
  thumbnail_url: string | null;
  privacy: 'public' | 'friends' | 'only_me';
  privacy_display: string;
  allow_comments: boolean;
  allow_sharing: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  duration: number;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_blocked: boolean;
  is_blocked_display: string;
}

export interface VideoComment {
  id: number;
  user: number;
  user_details: {
    id: number;
    email: string;
    role: string;
    full_name?: string;
    profile_picture?: string;
  };
  video: number;
  parent: number | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  replies: VideoComment[];
  replies_count: number;
  can_view: boolean;
  can_delete: boolean;
}

export interface VideoReport {
  id: number;
  reporter: number;
  video: number;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'nudity' | 'copyright' | 'other';
  description: string;
  created_at: string;
  resolved: boolean;
}

export interface ModerationQueueItem {
  id: number;
  title: string;
  description: string;
  user_details: {
    id: number;
    email: string;
    role: string;
    full_name?: string;
  };
  privacy: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  is_flagged: boolean;
  flagged_reason: string | null;
  report_count: number;
}

export interface VideoAnalytics {
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  average_views_per_video: number;
  engagement_rate: number;
}

export interface AdminStats {
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  flagged_videos: number;
  blocked_videos: number;
  reports_pending: number;
  by_role: {
    user_videos: number;
    moderator_videos: number;
    admin_videos: number;
  };
}

// Video Actions
export const videoActions = {
  getVideos: async (params?: {
    user?: number;
    search?: string;
    flagged?: string;
    blocked?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ success: boolean; data?: any; count?: number; error?: string }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      const endpoint = `/api/videos/videos/${queryString ? `?${queryString}` : ''}`;
      const response = await videoApiCall<any>(endpoint);
      
      return {
        success: true,
        data: response.results || response,
        count: response.count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch videos',
      };
    }
  },

  getVideo: async (id: number): Promise<{ success: boolean; data?: Video; error?: string }> => {
    try {
      const response = await videoApiCall<Video>(`/api/videos/videos/${id}/`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch video',
      };
    }
  },

  uploadVideo: async (formData: FormData): Promise<{ success: boolean; data?: Video; error?: string; details?: any }> => {
    try {
      const response = await videoApiCall<Video>('/api/videos/videos/', {
        method: 'POST',
        body: formData,
      });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload video',
        details: error.data,
      };
    }
  },

  updateVideo: async (id: number, data: Partial<Video>): Promise<{ success: boolean; data?: Video; error?: string }> => {
    try {
      const response = await videoApiCall<Video>(`/api/videos/videos/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update video',
      };
    }
  },

  deleteVideo: async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await videoApiCall(`/api/videos/videos/${id}/`, {
        method: 'DELETE',
      });
      return {
        success: true,
        message: 'Video deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete video',
      };
    }
  },

  toggleLike: async (id: number): Promise<{ success: boolean; liked?: boolean; message?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ liked: boolean; message: string }>(`/api/videos/videos/${id}/like/`, {
        method: 'POST',
      });
      return {
        success: true,
        liked: response.liked,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle like',
      };
    }
  },

  shareVideo: async (id: number): Promise<{ success: boolean; shares_count?: number; message?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ shares_count: number; message: string }>(`/api/videos/videos/${id}/share/`, {
        method: 'POST',
      });
      return {
        success: true,
        shares_count: response.shares_count,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to share video',
      };
    }
  },

  reportVideo: async (id: number, reason: string, description?: string): Promise<{ success: boolean; data?: VideoReport; error?: string }> => {
    try {
      const response = await videoApiCall<VideoReport>(`/api/videos/videos/${id}/report/`, {
        method: 'POST',
        body: JSON.stringify({ reason, description }),
      });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to report video',
      };
    }
  },

  getTrendingVideos: async (): Promise<{ success: boolean; data?: Video[]; error?: string }> => {
    try {
      const response = await videoApiCall<Video[]>('/api/videos/videos/trending/');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch trending videos',
      };
    }
  },

  getFeed: async (): Promise<{ success: boolean; data?: Video[]; count?: number; error?: string }> => {
    try {
      const response = await videoApiCall<any>('/api/videos/videos/feed/');
      return {
        success: true,
        data: response.results || response,
        count: response.count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch feed',
      };
    }
  },

  getAnalytics: async (): Promise<{ success: boolean; data?: VideoAnalytics; error?: string }> => {
    try {
      const response = await videoApiCall<VideoAnalytics>('/api/videos/videos/analytics/');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      };
    }
  },

  blockVideo: async (id: number, reason?: string): Promise<{ success: boolean; message?: string; blocked_reason?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ message: string; blocked_reason: string }>(`/api/videos/videos/${id}/block/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return {
        success: true,
        message: response.message,
        blocked_reason: response.blocked_reason,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to block video',
      };
    }
  },

  unblockVideo: async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ message: string }>(`/api/videos/videos/${id}/unblock/`, {
        method: 'POST',
      });
      return {
        success: true,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to unblock video',
      };
    }
  },

  getModerationQueue: async (page?: number): Promise<{ success: boolean; data?: ModerationQueueItem[]; count?: number; error?: string }> => {
    try {
      const queryParams = page ? `?page=${page}` : '';
      const response = await videoApiCall<any>(`/api/videos/videos/moderation-queue/${queryParams}`);
      return {
        success: true,
        data: response.results || response,
        count: response.count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch moderation queue',
      };
    }
  },

  resolveFlag: async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ message: string }>(`/api/videos/videos/${id}/resolve-flag/`, {
        method: 'POST',
      });
      return {
        success: true,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resolve flag',
      };
    }
  },

  getAdminStats: async (): Promise<{ success: boolean; data?: AdminStats; error?: string }> => {
    try {
      const response = await videoApiCall<AdminStats>('/api/videos/videos/admin/stats/');
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch admin stats',
      };
    }
  },
};

// Comment Actions
export const commentActions = {
  getComments: async (videoId: number, page?: number): Promise<{ success: boolean; data?: VideoComment[]; count?: number; error?: string }> => {
    try {
      const queryParams = new URLSearchParams({ video: videoId.toString() });
      if (page) queryParams.append('page', page.toString());
      const response = await videoApiCall<any>(`/api/videos/comments/?${queryParams}`);
      return {
        success: true,
        data: response.results || response,
        count: response.count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch comments',
      };
    }
  },

  createComment: async (videoId: number, content: string, parentId?: number): Promise<{ success: boolean; data?: VideoComment; error?: string }> => {
    try {
      const response = await videoApiCall<VideoComment>('/api/videos/comments/', {
        method: 'POST',
        body: JSON.stringify({
          video: videoId,
          content,
          parent: parentId || null,
        }),
      });
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create comment',
      };
    }
  },

  deleteComment: async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await videoApiCall(`/api/videos/comments/${id}/`, {
        method: 'DELETE',
      });
      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete comment',
      };
    }
  },

  toggleLike: async (id: number): Promise<{ success: boolean; liked?: boolean; message?: string; error?: string }> => {
    try {
      const response = await videoApiCall<{ liked: boolean; message: string }>(`/api/videos/comments/${id}/like/`, {
        method: 'POST',
      });
      return {
        success: true,
        liked: response.liked,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle comment like',
      };
    }
  },

  getReplies: async (commentId: number): Promise<{ success: boolean; data?: VideoComment[]; error?: string }> => {
    try {
      const response = await videoApiCall<VideoComment[]>(`/api/videos/comments/${commentId}/replies/`);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch replies',
      };
    }
  },
};

// Helper functions
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatViewCount = (views: number): string => {
  if (!views) return '0';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString();
};

export const canModerate = (): boolean => {
  const user = getCurrentUserData();
  return user && ['moderator', 'admin', 'super_admin'].includes(user.role);
};

export const canAdmin = (): boolean => {
  const user = getCurrentUserData();
  return user && ['admin', 'super_admin'].includes(user.role);
};

export default { 
  videoActions, 
  commentActions, 
  formatDuration, 
  formatViewCount, 
  formatDate,
  canModerate,
  canAdmin,
  getFullMediaUrl
};