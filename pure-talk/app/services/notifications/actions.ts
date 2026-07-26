// src/services/notificationService.ts
import { getImageUrl } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function for API calls
async function apiCall<T>(
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
    console.log('📡 API Call:', endpoint);
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = {
        status: response.status,
        data: errorData,
        message: errorData.error || errorData.message || errorData.detail || 'An error occurred',
      };
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Type definitions matching backend
export interface Notification {
  id: number;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  recipient: number;
  sender?: number;
  message?: string;
  title?: string;
  related_user?: number;
  related_user_email?: string;
  metadata?: any;
  sender_name?: string | null;
  sender_avatar?: string | null;
  content?: string;
  target_url?: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Map backend notification types to frontend types
export const mapNotificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'like': 'like',
    'comment': 'comment',
    'mention': 'mention',
    'follow': 'follow',
    'system': 'system',
    'warning': 'system',
    'block': 'system',
    'friend_request': 'follow',
    'friend_accept': 'follow'
  };
  return typeMap[type] || 'system';
};

// Get user avatar with fallback
export const getUserAvatar = (avatar: string | null | undefined): string => {
  if (!avatar) return 'https://i.pravatar.cc/150?img=11';
  const imageUrl = getImageUrl(avatar);
  return imageUrl || 'https://i.pravatar.cc/150?img=11';
};

// Transform backend notification to frontend format
export const transformNotification = (backendNotif: any): Notification => {
  console.log('🔄 Transforming notification:', backendNotif);
  
  // Get sender name from various possible sources
  let senderName = null;
  if (backendNotif.related_user_email) {
    senderName = backendNotif.related_user_email;
  }
  if (backendNotif.metadata?.sender_name) {
    senderName = backendNotif.metadata.sender_name;
  }
  if (backendNotif.sender_name) {
    senderName = backendNotif.sender_name;
  }
  
  // Get content from various possible sources
  let content = backendNotif.message || backendNotif.title || '';
  
  // If no content, try to construct from metadata
  if (!content && backendNotif.metadata) {
    if (backendNotif.metadata.content) {
      content = backendNotif.metadata.content;
    } else if (backendNotif.metadata.text) {
      content = backendNotif.metadata.text;
    }
  }

  const transformed = {
    id: backendNotif.id,
    notification_type: backendNotif.notification_type,
    is_read: backendNotif.is_read,
    created_at: backendNotif.created_at,
    recipient: backendNotif.recipient,
    sender: backendNotif.sender || backendNotif.related_user,
    content: content,
    message: backendNotif.message,
    title: backendNotif.title,
    related_user: backendNotif.related_user,
    related_user_email: backendNotif.related_user_email,
    metadata: backendNotif.metadata,
    sender_name: senderName,
    sender_avatar: backendNotif.metadata?.sender_avatar || null,
    target_url: backendNotif.metadata?.target_url || null
  };
  
  console.log('✨ Transformed notification:', transformed);
  return transformed;
};

// Notification API functions
export const notificationAPI = {
  getNotifications: async (params?: {
    unread_only?: boolean;
    type?: string;
    page?: number;
    page_size?: number;
  }): Promise<Notification[]> => {
    const queryParams = new URLSearchParams();
    if (params?.unread_only) queryParams.append('unread_only', 'true');
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    
    const queryString = queryParams.toString();
    const endpoint = `/api/notifications/my-notifications/${queryString ? `?${queryString}` : ''}`;
    
    // API returns an array directly
    const response = await apiCall<any>(endpoint);
    
    console.log('📦 Raw response:', response);
    console.log('📦 Is array?', Array.isArray(response));
    console.log('📦 Length:', response?.length);
    
    // If response is an array, transform it
    if (Array.isArray(response)) {
      console.log('🔄 Transforming', response.length, 'notifications');
      const transformed = response.map(transformNotification);
      console.log('✅ Transformed:', transformed);
      return transformed;
    }
    
    // If response has results property (for paginated response)
    if (response && response.results && Array.isArray(response.results)) {
      console.log('🔄 Transforming paginated results');
      return response.results.map(transformNotification);
    }
    
    // If response is something else, return empty array
    console.warn('⚠️ Unexpected response format:', response);
    return [];
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return await apiCall<UnreadCountResponse>('/api/notifications/unread-count/');
  },

  markAsRead: async (notificationId: number): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(
      `/api/notifications/${notificationId}/mark-read/`,
      { method: 'POST' }
    );
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(
      '/api/notifications/mark-all-read/',
      { method: 'POST' }
    );
  },

  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(
      `/api/notifications/${notificationId}/`,
      { method: 'DELETE' }
    );
  }
};

export default notificationAPI;