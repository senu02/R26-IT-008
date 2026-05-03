// components/DeleteConfirmationModal.tsx
import React, { useEffect, useState } from 'react';
import { ThemeColors } from '@/context/theme';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme: ThemeColors;
  isDark: boolean;
  postContent?: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  theme,
  isDark,
  postContent,
  isDeleting = false,
}) => {
  const [animation, setAnimation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnimation('animate-fadeIn');
      document.body.style.overflow = 'hidden';
    } else {
      setAnimation('animate-fadeOut');
      document.body.style.overflow = 'unset';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const truncatedContent = postContent 
    ? postContent.length > 100 
      ? `${postContent.substring(0, 100)}...` 
      : postContent
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative ${theme.surface.glass} ${theme.surface.border} rounded-2xl w-full max-w-md ${animation}`}
        style={{ animation: `${animation} 0.2s ease-out` }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className={`${theme.text.primary} text-xl font-semibold`}>Delete Post?</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`${theme.text.secondary} mb-2`}>
            Are you sure you want to delete this post?
          </p>
          {truncatedContent && (
            <div className={`mt-3 p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-lg`}>
              <p className={`${theme.text.muted} text-sm italic`}>
                "{truncatedContent}"
              </p>
            </div>
          )}
          <p className={`${theme.text.muted} text-sm mt-3`}>
            This action cannot be undone and the post will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2.5 rounded-xl ${theme.surface.glassHover} ${theme.text.primary} font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium transition-all duration-200 hover:bg-red-600 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Post</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;