// components/User/Posts/Comment.tsx
import React, { useState } from 'react';
import { ThemeColors } from '@/context/theme';
import { getFallbackAvatarUrl } from '@/app/services/posts/actions';

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

interface CommentProps {
  comment: CommentData;
  theme: ThemeColors;
  isDark: boolean;
  onLike?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => Promise<void>;
  currentUserId?: number | null;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  theme, 
  isDark, 
  onLike, 
  onDelete, 
  onEdit,
  currentUserId 
}) => {
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [liked, setLiked] = useState(comment.liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const getAvatarSrc = (): string | null => {
    if (avatarLoadError) {
      return getFallbackAvatarUrl(comment.author.name);
    }
    if (comment.author.avatar && comment.author.avatar.trim() !== '' && 
        comment.author.avatar !== 'null' && comment.author.avatar !== 'undefined') {
      return comment.author.avatar;
    }
    return null;
  };

  const handleLike = () => {
    if (onLike) {
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
      onLike(comment.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    setShowMenu(false);
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    if (onEdit) {
      setIsSubmitting(true);
      try {
        await onEdit(comment.id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update comment:', error);
        alert('Failed to update comment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this comment?')) {
      onDelete(comment.id);
    }
    setShowMenu(false);
  };

  const avatarSrc = getAvatarSrc();
  const isAuthor = comment.author.id === currentUserId;

  return (
    <div className="flex space-x-3 py-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setAvatarLoadError(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {comment.author.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Comment Content */}
      <div className="flex-1">
        <div className={`${theme.surface.glassHover} rounded-2xl p-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap gap-x-2">
              <span className={`${theme.text.primary} font-semibold text-sm`}>
                {comment.author.name}
              </span>
              <span className={`${theme.text.muted} text-xs`}>
                @{comment.author.username}
              </span>
              <span className={`${theme.text.muted} text-xs`}>·</span>
              <span className={`${theme.text.muted} text-xs`}>
                {formatTime(comment.timestamp)}
              </span>
            </div>
            
            {/* Menu button for own comments */}
            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1 rounded-full ${theme.text.muted} hover:bg-white/10 transition-colors`}
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
                    <div className={`absolute right-0 mt-1 w-36 ${theme.surface.glass} ${theme.surface.border} rounded-lg shadow-lg z-20 overflow-hidden`}>
                      <button
                        onClick={handleEdit}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-blue-500 hover:bg-blue-500/10 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Comment Content or Edit Form */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full ${theme.surface.glassHover} rounded-xl px-3 py-2 text-sm ${theme.text.primary} placeholder:${theme.text.muted} outline-none resize-none transition-all duration-200`}
                rows={3}
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-gray-500 hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateComment}
                  disabled={!editContent.trim() || isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className={`${theme.text.secondary} text-sm mt-1 whitespace-pre-wrap break-words`}>
              {comment.content}
            </p>
          )}
          
          {/* Like button for comments */}
          {onLike && !isEditing && (
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 mt-2 transition-colors ${liked ? 'text-pink-500' : theme.text.muted} hover:text-pink-500`}
            >
              <svg className="w-3 h-3" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;