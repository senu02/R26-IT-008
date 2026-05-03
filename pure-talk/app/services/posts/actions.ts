// services/postService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.trim() === '') return null;
  
  // If it's already an absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Handle media paths
  if (path.startsWith('/media/')) {
    return `${API_BASE_URL}${path}`;
  }
  if (path.startsWith('media/')) {
    return `${API_BASE_URL}/${path}`;
  }
  
  // Default fallback
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
}

export interface CommentData {
  id: number;
  content: string;
  author: PostAuthor;
  created_at: string;
  like_count: number;
  is_liked?: boolean;
}

// Helper to get author avatar from Django's nested structure
const getAuthorAvatarFromDjango = (authorDetail: any): string | null => {
  if (!authorDetail) return null;
  let avatarPath = authorDetail.profile_picture;
  if (!avatarPath) return null;
  return getImageUrl(avatarPath);
};

// Helper to get author name from Django's nested structure
const getAuthorNameFromDjango = (authorDetail: any): string => {
  if (!authorDetail) return 'User';
  return authorDetail.full_name || 
         authorDetail.display_name ||
         authorDetail.email?.split('@')[0] || 
         'User';
};

// Helper to get username from Django's nested structure
const getUsernameFromDjango = (authorDetail: any): string => {
  if (!authorDetail) return '@user';
  if (authorDetail.email) {
    return `@${authorDetail.email.split('@')[0]}`;
  }
  return '@user';
};

// FIXED: Helper to extract image URL from post media
const extractPostImage = (post: any): string | null => {
  // Check if media array exists and has items
  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    const firstMedia = post.media[0];
    
    // Try to get file_url or file field
    let imagePath = firstMedia.file_url || firstMedia.file;
    
    if (imagePath) {
      console.log('Extracted image path from media:', imagePath);
      return getImageUrl(imagePath);
    }
  }
  
  // Check for direct image field (fallback)
  if (post.image) {
    console.log('Extracted image path from image field:', post.image);
    return getImageUrl(post.image);
  }
  
  console.log('No image found in post');
  return null;
};

// Helper to map backend post to frontend PostData
const mapPostToFrontend = (post: any, currentUserId?: number): PostData => {
  console.log('Raw post from backend:', JSON.stringify(post, null, 2));
  
  // Get author details
  const authorDetail = post.author_detail || post.author;
  
  const authorName = getAuthorNameFromDjango(authorDetail);
  const avatarUrl = getAuthorAvatarFromDjango(authorDetail);
  const username = getUsernameFromDjango(authorDetail);
  const authorId = authorDetail?.id;
  
  // Extract image URL
  const imageUrl = extractPostImage(post);
  
  // Check if current user liked the post
  const isLiked = post.user_has_liked || false;
  
  const mappedPost = {
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
  
  console.log('Mapped post for frontend:', mappedPost);
  return mappedPost;
};

// Post API endpoints
export const postAPI = {
  // Get feed posts
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
    
    console.log('Feed response posts count:', posts.length);
    return posts.map((post: any) => mapPostToFrontend(post, currentUser?.id));
  },

  // Get user's own posts
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
    
    console.log('My posts response:', posts);
    return posts.map((post: any) => mapPostToFrontend(post, currentUser?.id));
  },

  // Get saved posts
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

  // Create a new post with image support
  createPost: async (data: CreatePostData): Promise<PostData | null> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to create a post');
    }
    
    const currentUser = getCurrentUserData();
    
    let response;
    
    // If there's an image, use FormData
    if (data.image) {
      console.log('Creating post with image:', data.image.name, data.image.type, data.image.size);
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('privacy', data.privacy || 'public');
      formData.append('post_type', 'image');
      formData.append('uploaded_media', data.image);
      
      response = await apiCall<any>('/posts/', {
        method: 'POST',
        body: formData,
      });
      console.log('Create post response with image:', response);
    } else {
      // No image, use JSON
      console.log('Creating post without image');
      response = await apiCall<any>('/posts/', {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          privacy: data.privacy || 'public',
          post_type: data.post_type || 'text',
        }),
      });
      console.log('Create post response without image:', response);
    }
    
    if (response) {
      return mapPostToFrontend(response, currentUser?.id);
    }
    
    return null;
  },

  // Like a post
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

  // Unlike a post
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

  // Delete a post
  deletePost: async (postId: string): Promise<void> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to delete posts');
    }
    
    await apiCall(`/posts/${postId}/`, {
      method: 'DELETE',
    });
  },

  // Create a comment
  createComment: async (postId: string, content: string, parentId?: number): Promise<CommentData | null> => {
    if (!isAuthenticated()) {
      throw new Error('Please login to comment');
    }
    
    const currentUser = getCurrentUserData();
    const response = await apiCall<any>('/comments/', {
      method: 'POST',
      body: JSON.stringify({
        post: parseInt(postId),
        content: content,
        parent: parentId || null,
      }),
    });
    
    const authorName = currentUser?.full_name || 
                      currentUser?.display_name ||
                      currentUser?.email?.split('@')[0] || 
                      'User';
    
    const avatarUrl = currentUser?.profile_picture ? getImageUrl(currentUser.profile_picture) : null;
    const username = currentUser?.email ? `@${currentUser.email.split('@')[0]}` : '@user';
    
    return {
      id: response.id,
      content: response.content,
      author: {
        id: currentUser?.id,
        name: authorName,
        avatar: avatarUrl,
        username: username,
      },
      created_at: response.created_at,
      like_count: 0,
      is_liked: false,
    };
  },
};