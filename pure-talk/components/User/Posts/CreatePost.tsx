// components/User/Posts/CreatePost.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ThemeColors } from '@/context/theme';
import { getCurrentUserAvatar, getCurrentUserData, getFallbackAvatarUrl } from '@/app/services/posts/actions';
import { Image, Smile, SendHorizontal, X } from 'lucide-react';

interface CreatePostProps {
  theme: ThemeColors;
  isDark: boolean;
  onPost: (content: string, image?: File) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ theme, isDark, onPost }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserData = () => {
      const avatar = getCurrentUserAvatar();
      const userData = getCurrentUserData();
      const name = userData?.full_name || userData?.display_name || userData?.email?.split('@')[0] || 'User';
      
      setUserAvatar(avatar);
      setUserName(name);
      setAvatarError(false);
    };
    
    loadUserData();
    
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if ((content.trim() || selectedImage) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onPost(content, selectedImage || undefined);
        setContent('');
        setSelectedImage(null);
        setImagePreview(null);
        setIsFocused(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getAvatarSrc = (): string | null => {
    if (avatarError) {
      return getFallbackAvatarUrl(userName);
    }
    if (userAvatar && userAvatar.trim() !== '' && userAvatar !== 'null' && userAvatar !== 'undefined') {
      return userAvatar;
    }
    return null;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div className={`${theme.surface.glass} ${theme.surface.border} rounded-2xl mb-6 transition-all duration-300 overflow-hidden`}>
      {/* Create Post Header */}
      <div className="p-4 pb-2 flex items-center space-x-3">
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div 
          onClick={() => setIsFocused(true)}
          className={`flex-1 ${theme.surface.glassHover} rounded-full px-4 py-2.5 cursor-text transition-all duration-200`}
        >
          <span className={`${theme.text.muted} text-sm`}>
            {isFocused ? '' : `What's on your mind, ${userName.split(' ')[0]}?`}
          </span>
        </div>
      </div>

      {/* Expanded Post Area */}
      {isFocused && (
        <div className="px-4 pb-4">
          <textarea
            placeholder={`What's on your mind, ${userName.split(' ')[0]}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full bg-transparent ${theme.text.primary} placeholder:${theme.text.muted} outline-none resize-none text-base py-2`}
            rows={3}
            autoFocus
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-80 object-contain bg-black/20"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex space-x-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${theme.surface.glassHover} ${theme.text.muted} hover:text-green-500 transition-colors`}
              >
                <Image className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Photo/Video</span>
              </button>
              <button className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${theme.surface.glassHover} ${theme.text.muted} hover:text-blue-500 transition-colors`}>
                <Smile className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Feeling/Activity</span>
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsFocused(false)}
                className="px-4 py-1.5 rounded-lg text-gray-500 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={(!content.trim() && !selectedImage) || isSubmitting}
                className={`px-4 py-1.5 rounded-full bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white font-medium text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default CreatePost;