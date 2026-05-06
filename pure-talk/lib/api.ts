const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/media/')) return `${API_BASE_URL}${path}`;
  if (path.startsWith('media/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}/media/${path}`;
};

// Type definitions
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
  role?: 'user' | 'moderator' | 'admin' | 'super_admin';
  account_status?: 'active' | 'suspended' | 'banned';
  is_active?: boolean;
  is_suspended?: boolean;
  is_banned?: boolean;
  created_at?: string;
  updated_at?: string;
  last_active?: string;
  suspended_until?: string;
  suspension_reason?: string;
  banned_reason?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  role: string;
  permissions: {
    is_admin: boolean;
    is_moderator: boolean;
    can_moderate: boolean;
  };
}

export interface RegisterResponse {
  user: User;
  token: string;
  message: string;
}

export interface UserStats {
  total_users?: number;
  active_users?: number;
  suspended_users?: number;
  banned_users?: number;
  by_role?: {
    user: number;
    moderator: number;
    admin: number;
    super_admin: number;
  };
  recent_users?: User[];
  posts_count?: number;
  friends_count?: number;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  mobile_number?: string;
  location?: string;
  bio?: string;
  profile_picture?: File | string | null;
  cover_image?: File | string | null;
}

export interface ChangePasswordData {
  old_password?: string;
  new_password: string;
  confirm_password: string;
}

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

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiCall<LoginResponse>(
      '/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      localStorage.setItem('user_role', data.role);
    }
    
    return data;
  },

  register: async (formData: FormData): Promise<RegisterResponse> => {
    const data = await apiCall<RegisterResponse>(
      '/register/',
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      localStorage.setItem('Token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiCall<void>('/logout/', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('Token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return await apiCall<User>('/users/me/');
  },

  updateProfile: async (userData: UpdateProfileData | FormData): Promise<User> => {
    let body: BodyInit;
    let isFormData = false;
    
    if (userData instanceof FormData) {
      body = userData;
      isFormData = true;
    } else {
      const hasFile = Object.values(userData).some(value => value instanceof File);
      if (hasFile) {
        const formData = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === 'string') {
              formData.append(key, value);
            }
          }
        });
        body = formData;
        isFormData = true;
      } else {
        body = JSON.stringify(userData);
      }
    }
    
    const data = await apiCall<User>('/users/me/', {
      method: 'PATCH',
      body,
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
    
    if (data) {
      localStorage.setItem('user_data', JSON.stringify(data));
    }
    
    return data;
  },

  deleteAccount: async (password: string): Promise<void> => {
    await apiCall<void>('/users/me/', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
  },

  changePassword: async (userId: number, data: ChangePasswordData): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/change-password/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// User management endpoints
export const userAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiCall<{ count: number; users: User[] }>('/users/');
    return response.users || [];
  },

  getUserById: async (userId: number): Promise<User> => {
    return await apiCall<User>(`/users/${userId}/`);
  },

  updateUserByAdmin: async (userId: number, userData: Partial<User>): Promise<User> => {
    return await apiCall<User>(`/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  suspendUser: async (userId: number, days: number, reason?: string): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ days, reason }),
    });
  },

  unsuspendUser: async (userId: number): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/unsuspend/`, {
      method: 'POST',
    });
  },

  banUser: async (userId: number, reason: string): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/ban/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  unbanUser: async (userId: number): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/unban/`, {
      method: 'POST',
    });
  },

  changeUserRole: async (userId: number, role: string): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>(`/users/${userId}/role/`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  getUserStats: async (): Promise<UserStats | null> => {
    try {
      return await apiCall<UserStats>('/users/stats/');
    } catch (error: any) {
      if (error.status === 403) {
        console.info('User stats not available - admin access required');
        return null;
      }
      throw error;
    }
  },

  getPersonalStats: async (): Promise<{ posts_count: number; friends_count: number }> => {
    try {
      return await apiCall<{ posts_count: number; friends_count: number }>('/users/me/stats/');
    } catch (error: any) {
      // If endpoint doesn't exist, return default values
      if (error.status === 404) {
        console.info('Personal stats endpoint not available yet');
        return { posts_count: 0, friends_count: 0 };
      }
      console.error('Error fetching personal stats:', error);
      return { posts_count: 0, friends_count: 0 };
    }
  },

  listModerators: async (): Promise<User[]> => {
    return await apiCall<User[]>('/users/moderators/');
  },
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

export const getCurrentUserData = (): User | null => {
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
};

export const getUserRole = (): string | null => {
  return localStorage.getItem('user_role');
};

export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'admin' || role === 'super_admin';
};

export const isModerator = (): boolean => {
  const role = getUserRole();
  return role === 'moderator' || role === 'admin' || role === 'super_admin';
};

export const canManageUsers = (): boolean => {
  const role = getUserRole();
  return role === 'admin' || role === 'super_admin';
};

export default { 
  authAPI, 
  userAPI, 
  isAuthenticated, 
  getCurrentUserData, 
  getUserRole,
  isAdmin, 
  isModerator,
  canManageUsers,
  getImageUrl
};