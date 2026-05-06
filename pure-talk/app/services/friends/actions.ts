'use server';

// Note: We cannot access localStorage in server actions
// So we'll receive the token from the client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function for API requests with token passed from client
async function apiRequest<T>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  if (options.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.assign(headers, customHeaders);
  }

  // Ensure endpoint starts with / if it doesn't
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  console.log('API Request:', {
    url,
    method: options.method || 'GET',
    hasToken: !!token
  });

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      console.error('Authentication failed');
      const error: any = new Error('Session expired. Please login again.');
      error.status = 401;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
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

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  mobile_number?: string;
  birthday?: string;
  gender?: string;
  country?: string;
  city?: string;
  location?: string;
  bio?: string;
  profile_picture?: string | null;
  cover_image?: string | null;
  role?: string;
  account_status?: string;
  is_active?: boolean;
}

export interface FriendRequest {
  id: number;
  from_user: number;
  to_user: number;
  from_user_detail?: User;
  to_user_detail?: User;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  updated_at?: string;
}

export interface Friendship {
  id: number;
  user?: number;
  friend: number;
  friend_detail?: User;
  created_at: string;
}

export interface FriendSuggestion {
  user: User;
  mutual_friends_count: number;
  mutual_friends: User[];
}

// Friend Actions - These will be called from client components with token
export async function sendFriendRequest(token: string, userId: number, message?: string) {
  return apiRequest<{ message: string; data: FriendRequest }>(
    '/friends/send-request/',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message: message || '' }),
    }
  );
}

export async function acceptFriendRequest(token: string, requestId: number) {
  return apiRequest<{ message: string; friend: User }>(
    '/friends/accept-request/',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId }),
    }
  );
}

export async function rejectFriendRequest(token: string, requestId: number) {
  return apiRequest<{ message: string }>(
    '/friends/reject-request/',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId }),
    }
  );
}

export async function getPendingRequests(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: FriendRequest[] }>(
      '/friends/pending-requests/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
}

export async function getSentRequests(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: FriendRequest[] }>(
      '/friends/sent-requests/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    return [];
  }
}

export async function getFriendsList(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: Friendship[] }>(
      '/friends/list/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return [];
  }
}

export async function getFriendSuggestions(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: FriendSuggestion[] }>(
      '/friends/suggestions/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

export async function getDiscoverUsers(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: User[] }>(
      '/friends/discover/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching discover users:', error);
    return [];
  }
}

export async function blockUser(token: string, userId: number, reason?: string) {
  return apiRequest<{ message: string }>(
    '/friends/block/',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, reason: reason || '' }),
    }
  );
}

export async function unblockUser(token: string, userId: number) {
  return apiRequest<{ message: string }>(
    '/friends/unblock/',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }
  );
}

export async function getBlockedUsers(token: string) {
  try {
    const response = await apiRequest<{ count: number; results: User[] }>(
      '/friends/blocked-users/',
      token
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
}

export async function removeFriend(token: string, friendId: number) {
  return apiRequest<{ message: string }>(
    `/friends/remove-friend/${friendId}/`,
    token,
    {
      method: 'DELETE',
    }
  );
}

export async function checkFriendStatus(token: string, userId: number) {
  return apiRequest<{ status: string }>(
    `/friends/check-status/${userId}/`,
    token
  );
}

// Search users
export async function searchUsers(token: string, query: string) {
  if (!query.trim()) {
    return { results: [] as User[] };
  }
  
  try {
    const response = await apiRequest<{ results?: User[]; users?: User[] }>(
      `/users/?search=${encodeURIComponent(query)}`,
      token
    );
    
    if (response.results) {
      return { results: response.results };
    } else if (response.users) {
      return { results: response.users };
    }
    
    return { results: [] as User[] };
  } catch (error) {
    console.error('Search error:', error);
    return { results: [] as User[] };
  }
}