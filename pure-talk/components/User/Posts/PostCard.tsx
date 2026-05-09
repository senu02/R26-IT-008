// components/User/Posts/PostCard.tsx
import React, { useState } from 'react';
import { ThemeColors } from '@/context/theme';
import { getFallbackAvatarUrl } from '@/app/services/posts/actions';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export interface Post {
  id: string;
  author: {
    id?: number;
    name: string;
    avatar: string | null;
    username: string;
  };
  content: string;
  image?: string | null;
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  liked?: boolean;
}

interface PostCardProps {
  post: Post;
  theme: ThemeColors;
  isDark: boolean;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onRepost: (id: string) => void;
  onDelete?: (id: string) => void;
  isCommenting?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  theme, 
  isDark, 
  onLike, 
  onComment, 
  onRepost, 
  onDelete,
  isCommenting = false 
}) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
    await onLike(post.id);
    setIsLiking(false);
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Just now';
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(post.id);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getAvatarSrc = (): string | null => {
    if (avatarLoadError) {
      return getFallbackAvatarUrl(post.author.name);
    }
    if (post.author.avatar && post.author.avatar.trim() !== '' && 
        post.author.avatar !== 'null' && post.author.avatar !== 'undefined') {
      return post.author.avatar;
    }
    return null;
  };

  const getImageSrc = (): string | null => {
    if (imageLoadError) return null;
    if (post.image && post.image.trim() !== '' && 
        post.image !== 'null' && post.image !== 'undefined') {
      return post.image;
    }
    return null;
  };

  const avatarSrc = getAvatarSrc();
  const imageSrc = getImageSrc();

  return (
    <>
      <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl transition-all duration-300 overflow-hidden`}>
        {/* Post Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 cursor-pointer">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={() => setAvatarLoadError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
                    <span className="text-white font-bold text-base">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Author Info */}
              <div>
                <div className="flex items-center space-x-1 flex-wrap">
                  <h3 className={`${theme.text.primary} font-semibold hover:underline cursor-pointer text-sm sm:text-base`}>
                    {post.author.name}
                  </h3>
                  <span className={`${theme.text.muted} text-xs`}>·</span>
                  <span className={`${theme.text.muted} text-xs hover:underline cursor-pointer`}>
                    {formatTime(post.timestamp)}
                  </span>
                </div>
                <div className={`${theme.text.muted} text-xs`}>
                  {post.author.username}
                </div>
              </div>
            </div>
            
            {/* Menu Button - Only show if onDelete is provided */}
            {onDelete && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1.5 rounded-full ${theme.surface.glassHover} ${theme.text.muted} hover:bg-white/10 transition-colors`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className={`absolute right-0 mt-1 w-48 ${theme.surface.glass} ${theme.surface.border} rounded-xl shadow-lg z-20 overflow-hidden`}>
                      <button
                        onClick={handleDeleteClick}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Post</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-2">
          <p className={`${theme.text.secondary} leading-relaxed whitespace-pre-wrap break-words text-sm sm:text-base`}>
            {post.content}
          </p>
        </div>
        
        {/* Post Image */}
        {imageSrc && (
          <div className="mt-2 px-4">
            <div className="rounded-xl overflow-hidden bg-black/10">
              <img 
                src={imageSrc}
                alt="Post content" 
                className="w-full max-h-[500px] object-contain"
                onError={() => setImageLoadError(true)}
                loading="lazy"
              />
            </div>
          </div>
        )}
        
        {/* Stats Bar */}
        {(likesCount > 0 || post.comments > 0) && (
          <div className="px-4 py-2 flex items-center justify-between text-xs border-b border-white/10">
            <div className="flex items-center space-x-1">
              {likesCount > 0 && (
                <>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <span className={`${theme.text.muted} text-xs`}>{likesCount}</span>
                </>
              )}
            </div>
            {post.comments > 0 && (
              <button 
                onClick={() => onComment(post.id)}
                className={`${theme.text.muted} text-xs hover:underline transition-colors`}
              >
                {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-around py-1">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center justify-center space-x-2 flex-1 py-2 rounded-lg transition-all duration-200 ${
              liked ? 'text-pink-500' : theme.text.muted
            } hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">Like</span>
          </button>
          
          <button
            onClick={() => onComment(post.id)}
            className={`flex items-center justify-center space-x-2 flex-1 py-2 rounded-lg transition-all duration-200 ${
              isCommenting ? 'text-pink-500' : theme.text.muted
            } hover:bg-white/5`}
          >
            <svg className="w-5 h-5" fill={isCommenting ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">Comment</span>
          </button>
          
          <button
            onClick={() => onRepost(post.id)}
            className={`flex items-center justify-center space-x-2 flex-1 py-2 rounded-lg ${theme.text.muted} hover:bg-white/5 transition-all duration-200`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        theme={theme}
        isDark={isDark}
        postContent={post.content}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default PostCard;