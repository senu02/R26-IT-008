// services/postService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.trim() === '') return null;
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  if (path.startsWith('/media/')) {
    return `${API_BASE_URL}${path}`;
  }
  if (path.startsWith('media/')) {
    return `${API_BASE_URL}/${path}`;
  }
  
  return `${API_BASE_URL}/media/${path}`;
};

// Authentication check helper
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('auth_token');
  return !!token && token.trim() !== '';
};

// Get current user data from localStorage
export const getCurrentUserData = (): any => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  try {
    const parsed = JSON.parse(userData);
    return parsed;
  } catch {
    return null;
  }
};

// Get current user avatar
export const getCurrentUserAvatar = (): string | null => {
  if (typeof window === 'undefined') return null;
  const userData = getCurrentUserData();
  if (!userData) return null;
  
  const avatarPath = userData.profile_picture;
  if (!avatarPath) return null;
  return getImageUrl(avatarPath);
};

// Generate a fallback avatar URL
export const getFallbackAvatarUrl = (name: string): string => {
  const encodedName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?background=fd297b&color=fff&bold=true&size=128&name=${encodedName}`;
};

// Local apiCall function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('API calls can only be made on the client side');
  }

  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body) {
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
    let url = endpoint;
    if (!url.startsWith('/api/') && !url.startsWith('http')) {
      url = `/api${url.startsWith('/') ? url : `/${url}`}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
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

// Types
export interface PostAuthor {
  id?: number;
  name: string;
  avatar: string | null;
  username: string;
}

export interface PostData {
  id: string;
  author: PostAuthor;
  content: string;
  image?: string | null;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  liked?: boolean;
}

export interface CreatePostData {
  content: string;
  image?: File;
  privacy?: 'public' | 'friends' | 'only_me';
  post_type?: 'text' | 'image' | 'video' | 'link';
  // The text the user actually typed, before AESM rewriting/blurring.
  // Sent alongside `content` so backend enforcement scores what the
  // user really wrote, not the sanitized display text.
  originalContent?: string;
}

export interface CommentData {
  id: string;
  content: string;
  author: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  timestamp: string;
  likes: number;
  liked: boolean;
}

// Helper functions for Django data
const getAuthorAvatarFromDjango = (authorDetail: any): string | null => {
  if (!authorDetail) return null;
  let avatarPath = authorDetail.profile_picture;
  if (!avatarPath) return null;
  return getImageUrl(avatarPath);
};

const getAuthorNameFromDjango = (authorDetail: any): string => {
  if (!authorDetail) return 'User';
  return authorDetail.full_name || 
         authorDetail.display_name ||
         authorDetail.email?.split('@')[0] || 
         'User';
};

const getUsernameFromDjango = (authorDetail: any): string => {
  if (!authorDetail) return '@user';
  if (authorDetail.email) {
    return `@${authorDetail.email.split('@')[0]}`;
  }
  return '@user';
};

const extractPostImage = (post: any): string | null => {
  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    const firstMedia = post.media[0];
    let imagePath = firstMedia.file_url || firstMedia.file;
    if (imagePath) {
      return getImageUrl(imagePath);
    }
  }
  
  if (post.image) {
    return getImageUrl(post.image);
  }
  
  return null;
};

const mapPostToFrontend = (post: any, currentUserId?: number): PostData => {
  const authorDetail = post.author_detail || post.author;
  
  const authorName = getAuthorNameFromDjango(authorDetail);
  const avatarUrl = getAuthorAvatarFromDjango(authorDetail);
  const username = getUsernameFromDjango(authorDetail);
  const authorId = authorDetail?.id;
  const imageUrl = extractPostImage(post);
  const isLiked = post.user_has_liked || false;
  
  return {
    id: post.id.toString(),
    author: {
      id: authorId,
      name: authorName,
      avatar: avatarUrl,
      username: username,
    },
    content: post.content || '',
    image: imageUrl,
    timestamp: post.created_at,
    likes: post.like_count || 0,
    comments: post.comment_count || 0,
    reposts: post.share_count || 0,
    liked: isLiked,
  };
};

// Post API endpoints
export const postAPI = {
  getFeed: async (page = 1, pageSize = 20): Promise<PostData[]> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to view posts');
    }
    
    const currentUser = getCurrentUserData();
    const response = await apiCall<any>(`/posts/feed/?page=${page}&page_size=${pageSize}`);
    
    let posts = [];
    if (response.results) {
      posts = response.results;
    } else if (Array.isArray(response)) {
      posts = response;
    }
    
    return posts.map((post: any) => mapPostToFrontend(post, currentUser?.id));
  },

  getMyPosts: async (): Promise<PostData[]> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to view your posts');
    }
    
    const currentUser = getCurrentUserData();
    const response = await apiCall<any>('/posts/my-posts/');
    
    let posts = [];
    if (response.results) {
      posts = response.results;
    } else if (Array.isArray(response)) {
      posts = response;
    }
    
    return posts.map((post: any) => mapPostToFrontend(post, currentUser?.id));
  },

  getSavedPosts: async (): Promise<PostData[]> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to view saved posts');
    }
    
    const currentUser = getCurrentUserData();
    const response = await apiCall<any>('/posts/saved/');
    
    let posts = [];
    if (response.results) {
      posts = response.results;
    } else if (Array.isArray(response)) {
      posts = response;
    }
    
    return posts.map((post: any) => mapPostToFrontend(post, currentUser?.id));
  },

  createPost: async (data: CreatePostData): Promise<PostData | null> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to create a post');
    }
    
    const currentUser = getCurrentUserData();
    
    let response;
    
    if (data.image) {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('privacy', data.privacy || 'public');
      formData.append('post_type', 'image');
      formData.append('uploaded_media', data.image);
      if (data.originalContent) {
        formData.append('original_content', data.originalContent);
      }
      
      response = await apiCall<any>('/posts/', {
        method: 'POST',
        body: formData,
      });
    } else {
      response = await apiCall<any>('/posts/', {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          privacy: data.privacy || 'public',
          post_type: data.post_type || 'text',
          ...(data.originalContent ? { original_content: data.originalContent } : {}),
        }),
      });
    }
    
    if (response) {
      return mapPostToFrontend(response, currentUser?.id);
    }
    
    return null;
  },

  likePost: async (postId: string): Promise<{ likeCount: number; isLiked: boolean }> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to like posts');
    }
    
    const response = await apiCall<any>(`/posts/${postId}/like/`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: 'like' }),
    });
    
    return {
      likeCount: response.like_count || 0,
      isLiked: true,
    };
  },

  unlikePost: async (postId: string): Promise<{ likeCount: number; isLiked: boolean }> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to unlike posts');
    }
    
    const response = await apiCall<any>(`/posts/${postId}/unlike/`, {
      method: 'POST',
    });
    
    return {
      likeCount: response.like_count || 0,
      isLiked: false,
    };
  },

  deletePost: async (postId: string): Promise<void> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to delete posts');
    }
    
    await apiCall(`/posts/${postId}/`, {
      method: 'DELETE',
    });
  },

  createComment: async (postId: string, content: string, originalContent?: string): Promise<CommentData | null> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to comment');
    }
    
    const currentUser = getCurrentUserData();
    const response = await apiCall<any>('/comments/', {
      method: 'POST',
      body: JSON.stringify({
        post: parseInt(postId),
        content: content,
        ...(originalContent ? { original_content: originalContent } : {}),
      }),
    });
    
    const authorName = currentUser?.full_name || 
                      currentUser?.display_name ||
                      currentUser?.email?.split('@')[0] || 
                      'User';
    
    const avatarUrl = currentUser?.profile_picture ? getImageUrl(currentUser.profile_picture) : null;
    const username = currentUser?.email ? `@${currentUser.email.split('@')[0]}` : '@user';
    
    return {
      id: String(response.id),
      content: response.content,
      author: {
        id: currentUser?.id || 0,
        name: authorName,
        avatar: avatarUrl,
        username: username,
      },
      timestamp: response.created_at || new Date().toISOString(),
      likes: 0,
      liked: false,
    };
  },

  // NEW: Get comments for a post
  getComments: async (postId: string): Promise<CommentData[]> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to view comments');
    }
    
    const response = await apiCall<any>(`/comments/?post_id=${postId}`);
    const items = response.results || response;
    
    if (!Array.isArray(items)) return [];
    
    return items.map((comment: any) => {
      const authorDetail = comment.author_detail || comment.author;
      return {
        id: String(comment.id),
        content: comment.content,
        author: {
          id: authorDetail?.id || 0,
          name: getAuthorNameFromDjango(authorDetail),
          username: getUsernameFromDjango(authorDetail),
          avatar: getAuthorAvatarFromDjango(authorDetail),
        },
        timestamp: comment.created_at,
        likes: comment.like_count || 0,
        liked: comment.user_has_liked || false,
      };
    });
  },

  // NEW: Update a comment
  updateComment: async (commentId: string, content: string): Promise<CommentData> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to edit comments');
    }
    
    const response = await apiCall<any>(`/comments/${commentId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    
    const authorDetail = response.author_detail || response.author;
    
    return {
      id: String(response.id),
      content: response.content,
      author: {
        id: authorDetail?.id || 0,
        name: getAuthorNameFromDjango(authorDetail),
        username: getUsernameFromDjango(authorDetail),
        avatar: getAuthorAvatarFromDjango(authorDetail),
      },
      timestamp: response.created_at,
      likes: response.like_count || 0,
      liked: response.user_has_liked || false,
    };
  },

  // NEW: Delete a comment
  deleteComment: async (commentId: string): Promise<void> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to delete comments');
    }
    
    await apiCall(`/comments/${commentId}/`, {
      method: 'DELETE',
    });
  },
};