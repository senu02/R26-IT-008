// app/lib/api.ts
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

  // For FormData, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Merge with any custom headers from options
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
    
    // Handle 401 unauthorized
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        data: errorData,
        message: errorData.error || errorData.message || 'An error occurred',
      };
    }

    // Return empty object for 204 No Content
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
  login: async (email: string, password: string) => {
    const data = await apiCall<{ user: any; token: string; role: string; permissions: any }>(
      '/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    
    return data;
  },

  register: async (formData: FormData) => {
    const data = await apiCall<{ user: any; token: string; message: string }>(
      '/register/',  // Your original URL - NOT CHANGED
      {
        method: 'POST',
        body: formData,  // FormData for images
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

  logout: async () => {
    try {
      await apiCall('/logout/', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('Token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    return await apiCall('/users/me/');
  },

  updateProfile: async (userData: any) => {
    const data = await apiCall('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    if (data) {
      localStorage.setItem('user_data', JSON.stringify(data));
    }
    
    return data;
  },

  deleteAccount: async (password: string) => {
    const data = await apiCall('/users/me/', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    return data;
  },
};

// User management endpoints (for admin/moderator)
export const userAPI = {
  getAllUsers: async () => {
    return await apiCall('/users/');
  },

  getUserById: async (userId: number) => {
    return await apiCall(`/users/${userId}/`);
  },

  updateUserByAdmin: async (userId: number, userData: any) => {
    return await apiCall(`/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  suspendUser: async (userId: number, days: number, reason?: string) => {
    return await apiCall(`/users/${userId}/suspend/`, {
      method: 'POST',
      body: JSON.stringify({ days, reason }),
    });
  },

  unsuspendUser: async (userId: number) => {
    return await apiCall(`/users/${userId}/unsuspend/`, {
      method: 'POST',
    });
  },

  banUser: async (userId: number, reason: string) => {
    return await apiCall(`/users/${userId}/ban/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  unbanUser: async (userId: number) => {
    return await apiCall(`/users/${userId}/unban/`, {
      method: 'POST',
    });
  },

  changeUserRole: async (userId: number, role: string) => {
    return await apiCall(`/users/${userId}/role/`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  changePassword: async (userId: number, data: { old_password?: string; new_password: string; confirm_password: string }) => {
    return await apiCall(`/users/${userId}/change-password/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getUserStats: async () => {
    return await apiCall('/users/stats/');
  },

  listModerators: async () => {
    return await apiCall('/users/moderators/');
  },
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Helper function to get current user data from localStorage
export const getCurrentUserData = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Helper function to check user roles
export const hasRole = (roles: string | string[]): boolean => {
  const user = getCurrentUserData();
  if (!user) return false;
  
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.includes(user.role);
};

export const isAdmin = (): boolean => {
  return hasRole(['admin', 'super_admin']);
};

export const isModerator = (): boolean => {
  return hasRole(['moderator', 'admin', 'super_admin']);
};

export default { authAPI, userAPI, isAuthenticated, getCurrentUserData, hasRole, isAdmin, isModerator };