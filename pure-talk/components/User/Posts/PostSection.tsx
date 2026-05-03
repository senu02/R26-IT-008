// components/User/Posts/PostSection.tsx
import React, { useState, useEffect } from 'react';
import { ThemeColors } from '@/context/theme';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import Comment from './Comment';
import type { CommentData } from './Comment';
import { postAPI, PostData, isAuthenticated, getCurrentUserData, getCurrentUserAvatar, getImageUrl } from '@/app/services/posts/actions';
import { Lock, SendHorizontal, Loader2, PlusCircle, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface PostSectionProps {
  theme: ThemeColors;
  isDark: boolean;
}

const PostSection: React.FC<PostSectionProps> = ({ theme, isDark }) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('For You');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: CommentData[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [showCommentsForPost, setShowCommentsForPost] = useState<{ [key: string]: boolean }>({});

  const filterOptions = ['For You', 'My Posts', 'Saved'];

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isAuthenticated();
      setIsLoggedIn(loggedIn);
      if (!loggedIn) {
        setError('Please login to view posts');
        setLoading(false);
      }
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const loadPosts = async () => {
    if (!isLoggedIn) {
      setError('Please login to view posts');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let data: PostData[] = [];
      if (activeFilter === 'My Posts') {
        data = await postAPI.getMyPosts();
      } else if (activeFilter === 'Saved') {
        data = await postAPI.getSavedPosts();
      } else {
        data = await postAPI.getFeed();
      }
      
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error('Expected array but got:', data);
        setPosts([]);
      }
    } catch (err: any) {
      console.error('Error loading posts:', err);
      if (err.message?.includes('login') || err.message?.includes('Authentication')) {
        setError('Please login to view posts');
        setIsLoggedIn(false);
      } else {
        setError(err.message || 'Failed to load posts');
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch comments for a specific post
  const fetchCommentsForPost = async (postId: string) => {
    if (loadingComments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/comments/?post_id=${postId}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const commentsData = await response.json();
        const items = commentsData.results || commentsData;
        const mappedComments: CommentData[] = Array.isArray(items) 
          ? items.map((comment: any) => mapCommentToFrontend(comment))
          : [];
        
        setComments(prev => ({ ...prev, [postId]: mappedComments }));
      } else {
        setComments(prev => ({ ...prev, [postId]: [] }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments(prev => ({ ...prev, [postId]: [] }));
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Helper to map backend comment to frontend format
  const mapCommentToFrontend = (comment: any): CommentData => {
    const authorDetail = comment.author_detail || comment.author;
    return {
      id: String(comment.id),
      content: comment.content,
      author: {
        id: authorDetail?.id || 0,
        name: authorDetail?.full_name || authorDetail?.display_name || 'User',
        username: authorDetail?.email ? `@${authorDetail.email.split('@')[0]}` : '@user',
        avatar: authorDetail?.profile_picture ? getImageUrl(authorDetail.profile_picture) : null,
      },
      timestamp: comment.created_at || comment.timestamp || new Date().toISOString(),
      likes: comment.like_count || 0,
      liked: comment.user_has_liked || false,
    };
  };

  const toggleComments = async (postId: string) => {
    const isVisible = showCommentsForPost[postId];
    
    if (!isVisible) {
      if (!comments[postId]) {
        await fetchCommentsForPost(postId);
      }
      setShowCommentsForPost(prev => ({ ...prev, [postId]: true }));
    } else {
      setShowCommentsForPost(prev => ({ ...prev, [postId]: false }));
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadPosts();
      setComments({});
      setShowCommentsForPost({});
    }
  }, [activeFilter, isLoggedIn]);

  const handleNewPost = async (content: string, image?: File) => {
    if (!isLoggedIn) {
      alert('Please login to create a post');
      return;
    }

    try {
      const newPost = await postAPI.createPost({ content, image });
      if (newPost) {
        setPosts([newPost, ...posts]);
      }
    } catch (err: any) {
      if (err.message?.includes('flagged')) {
        alert(err.message);
      } else if (err.message?.includes('login')) {
        alert('Please login to create a post');
        setIsLoggedIn(false);
      } else {
        alert('Failed to create post. Please try again.');
      }
      console.error('Error creating post:', err);
    }
  };

  const handleLike = async (id: string) => {
    if (!isLoggedIn) {
      alert('Please login to like posts');
      return;
    }

    const post = posts.find(p => p.id === id);
    if (!post) return;

    try {
      let result;
      if (post.liked) {
        result = await postAPI.unlikePost(id);
      } else {
        result = await postAPI.likePost(id);
      }
      
      setPosts(posts.map(p => 
        p.id === id 
          ? { ...p, liked: result.isLiked, likes: result.likeCount }
          : p
      ));
    } catch (err: any) {
      if (err.message?.includes('login')) {
        alert('Please login to like posts');
        setIsLoggedIn(false);
      } else {
        console.error('Like/unlike failed:', err);
        alert('Failed to like/unlike post. Please try again.');
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!isLoggedIn) {
      alert('Please login to comment');
      return;
    }

    const content = commentText[postId];
    if (!content || !content.trim()) {
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    try {
      const newComment = await postAPI.createComment(postId, content);
      
      if (newComment) {
        await fetchCommentsForPost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, comments: (p.comments || 0) + 1 }
            : p
        ));
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        setShowCommentsForPost(prev => ({ ...prev, [postId]: true }));
      }
    } catch (err: any) {
      console.error('Comment failed:', err);
      if (err.message?.includes('flagged')) {
        alert(err.message);
      } else if (err.message?.includes('login')) {
        alert('Please login to comment');
        setIsLoggedIn(false);
      } else {
        alert('Failed to add comment. Please try again.');
      }
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!isLoggedIn) {
      alert('Please login to edit comments');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/comments/${commentId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        
        setComments(prevComments => {
          const newComments = { ...prevComments };
          for (const postId in newComments) {
            const commentIndex = newComments[postId].findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
              newComments[postId][commentIndex] = {
                ...newComments[postId][commentIndex],
                content: updatedComment.content,
              };
              break;
            }
          }
          return newComments;
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }
    } catch (err: any) {
      console.error('Edit comment failed:', err);
      if (err.message?.includes('flagged')) {
        alert(err.message);
      } else {
        alert('Failed to update comment. Please try again.');
      }
      throw err;
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!isLoggedIn) {
      alert('Please login to delete comments');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        await fetchCommentsForPost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, comments: Math.max(0, (p.comments || 0) - 1) }
            : p
        ));
      } else {
        alert('Failed to delete comment');
      }
    } catch (err) {
      console.error('Delete comment failed:', err);
      alert('Failed to delete comment');
    }
  };

  const handleRepost = async (id: string) => {
    if (!isLoggedIn) {
      alert('Please login to share posts');
      return;
    }

    try {
      const post = posts.find(p => p.id === id);
      if (post) {
        await postAPI.createPost({ 
          content: `Shared: ${post.content.substring(0, 100)}...`,
          privacy: 'public'
        });
        
        setPosts(posts.map(p => 
          p.id === id 
            ? { ...p, reposts: (p.reposts || 0) + 1 }
            : p
        ));
        alert('Post shared successfully!');
      }
    } catch (err: any) {
      if (err.message?.includes('login')) {
        alert('Please login to share posts');
        setIsLoggedIn(false);
      } else {
        console.error('Repost failed:', err);
        alert('Failed to share post');
      }
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!isLoggedIn) {
      alert('Please login to delete posts');
      return Promise.reject('Not logged in');
    }

    try {
      await postAPI.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
      return Promise.resolve();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
      return Promise.reject(err);
    }
  };

  const getCurrentUserId = (): number | null => {
    try {
      const userData = getCurrentUserData();
      return userData?.id || null;
    } catch (e) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl p-8 text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h3 className={`${theme.text.primary} text-xl font-semibold mb-2`}>Login Required</h3>
          <p className={`${theme.text.muted} mb-6`}>Please login to view and interact with posts</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-full p-1">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-1 py-2 px-4 rounded-full transition-all duration-300 ${
              activeFilter === filter
                ? `bg-gradient-to-r ${theme.accent.gradient} text-white`
                : `${theme.text.secondary} hover:${theme.text.primary}`
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <CreatePost theme={theme} isDark={isDark} onPost={handleNewPost} />

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="inline-block w-8 h-8 text-pink-500 animate-spin" />
          <p className={`${theme.text.muted} mt-2`}>Loading posts...</p>
        </div>
      )}

      {error && !loading && (
        <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl p-6 text-center`}>
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => {
              if (isLoggedIn) loadPosts();
              else window.location.href = '/login';
            }}
            className="mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white text-sm"
          >
            {isLoggedIn ? 'Retry' : 'Go to Login'}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl p-6 text-center`}>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b]/20 flex items-center justify-center">
                  <PlusCircle className="w-8 h-8 text-[#fd297b]" />
                </div>
                <div>
                  <p className={`${theme.text.primary} font-medium mb-1`}>No posts yet</p>
                  <p className={`${theme.text.muted} text-sm`}>
                    {activeFilter === 'My Posts' 
                      ? "You haven't created any posts yet. Share something with the community!" 
                      : activeFilter === 'Saved'
                      ? "You haven't saved any posts yet. Save posts to read them later!"
                      : "No posts to show. Follow more people or create your first post!"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id}>
                <PostCard
                  post={post}
                  theme={theme}
                  isDark={isDark}
                  onLike={handleLike}
                  onComment={() => toggleComments(post.id)}
                  onRepost={handleRepost}
                  onDelete={post.author.id === currentUserId ? handleDelete : undefined}
                  isCommenting={showCommentsForPost[post.id]}
                />
                
                {/* Comments Section */}
                {showCommentsForPost[post.id] && (
                  <div className={`mt-2 ${theme.surface.glass} rounded-xl overflow-hidden transition-all duration-300`}>
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <h3 className={`${theme.text.primary} text-sm font-semibold`}>
                        Comments ({post.comments || 0})
                      </h3>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`${theme.text.muted} hover:${theme.text.primary} transition-colors`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {loadingComments[post.id] ? (
                        <div className="text-center py-4">
                          <Loader2 className="inline-block w-5 h-5 text-pink-500 animate-spin" />
                        </div>
                      ) : comments[post.id] && comments[post.id].length > 0 ? (
                        comments[post.id].map((comment) => (
                          <Comment
                            key={comment.id}
                            comment={comment}
                            theme={theme}
                            isDark={isDark}
                            onDelete={comment.author.id === currentUserId 
                              ? (commentId) => handleDeleteComment(post.id, commentId)
                              : undefined}
                            onEdit={comment.author.id === currentUserId 
                              ? (commentId, newContent) => handleEditComment(commentId, newContent)
                              : undefined}
                            currentUserId={currentUserId}
                          />
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <MessageCircle className={`w-8 h-8 mx-auto mb-2 ${theme.text.muted}`} />
                          <p className={`${theme.text.muted} text-sm`}>
                            No comments yet. Be the first to comment!
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getCurrentUserAvatar() ? (
                            <img 
                              src={getCurrentUserAvatar() || undefined} 
                              alt="Your avatar"
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {getCurrentUserData()?.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Write a comment..."
                            className={`w-full ${theme.surface.glassHover} rounded-xl px-4 py-2 text-sm ${theme.text.primary} placeholder:${theme.text.muted} outline-none resize-none transition-all duration-200`}
                            rows={2}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!commentText[post.id]?.trim() || submittingComment[post.id]}
                              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white font-medium text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                              {submittingComment[post.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <SendHorizontal className="w-4 h-4" />
                                  <span>Comment</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {(post.comments || 0) > 0 && !showCommentsForPost[post.id] && (
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`mt-1 ${theme.text.muted} text-xs hover:${theme.text.primary} transition-colors flex items-center space-x-1`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>View {post.comments} comments</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PostSection;