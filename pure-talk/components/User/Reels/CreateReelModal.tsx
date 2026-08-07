'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FaTimes, 
  FaUpload, 
  FaPlay, 
  FaPause,
  FaVideo,
  FaImage,
  FaLock,
  FaGlobe,
  FaUserFriends,
  FaCheck,
  FaTrash,
  FaCamera
} from 'react-icons/fa';
import { ThemeColors, getTheme } from '@/context/theme';
import { videoActions } from '@/app/services/videos/actions';
import { useToast } from '@/context/toast';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isDarkMode?: boolean;
  theme?: ThemeColors;
}

export default function CreateReelModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  isDarkMode = true,
  theme: customTheme 
}: CreateReelModalProps) {
  const theme = customTheme || getTheme(isDarkMode);
  const { showSuccess, showError } = useToast();
  
  const [step, setStep] = useState<'upload' | 'details' | 'processing'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (!isUploading) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isUploading, onClose]);

  const resetForm = () => {
    setStep('upload');
    setTitle('');
    setDescription('');
    setPrivacy('public');
    setAllowComments(true);
    setAllowSharing(true);
    setSelectedFile(null);
    setVideoPreview(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setIsUploading(false);
    setUploadProgress(0);
    setDuration(0);
    setIsPlaying(false);
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    // Validate file size (max 100MB for users)
    if (file.size > 100 * 1024 * 1024) {
      showError('Video file too large. Maximum size is 100MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    const isValidType = allowedTypes.includes(file.type) || 
                       ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension || '');

    if (!isValidType) {
      showError('Unsupported video format. Please upload MP4, MOV, AVI, MKV, or WEBM.');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    
    // Get video duration
    const video = document.createElement('video');
    video.src = previewUrl;
    video.onloadedmetadata = () => {
      setDuration(Math.round(video.duration));
    };
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Thumbnail too large. Maximum size is 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showError('Unsupported image format. Please upload JPEG, PNG, WEBP, or GIF.');
      return;
    }

    setThumbnail(file);
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  };

  const captureThumbnail = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
            showSuccess('Thumbnail captured from video!');
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      showError('Please select a video file.');
      return;
    }

    if (!title.trim()) {
      showError('Please enter a title for your reel.');
      return;
    }

    setIsUploading(true);
    setStep('processing');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video_file', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('privacy', privacy);
      formData.append('allow_comments', String(allowComments));
      formData.append('allow_sharing', String(allowSharing));
      
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await videoActions.uploadVideo(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        showSuccess('Reel uploaded successfully! 🎬');
        setTimeout(() => {
          resetForm();
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        showError(result.error || 'Failed to upload reel');
        setStep('details');
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload reel. Please try again.');
      setStep('details');
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  if (!isOpen) return null;

  // Get theme colors - fixed to use correct theme properties
  const getSurfaceBg = () => {
    if (isDarkMode) {
      return 'bg-gray-800/50';
    }
    return 'bg-white/50';
  };

  const getBg = () => {
    if (isDarkMode) {
      return 'bg-gray-900';
    }
    return 'bg-white';
  };

  const getBorder = () => {
    if (isDarkMode) {
      return 'border-gray-700';
    }
    return 'border-gray-200';
  };

  const getTextPrimary = () => {
    if (isDarkMode) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  const getTextSecondary = () => {
    if (isDarkMode) {
      return 'text-gray-300';
    }
    return 'text-gray-600';
  };

  const getTextMuted = () => {
    if (isDarkMode) {
      return 'text-gray-400';
    }
    return 'text-gray-500';
  };

  // Get gradient class from accent
  const getGradientClass = () => {
    if (theme.accent && typeof theme.accent.gradient === 'string') {
      return `bg-gradient-to-r ${theme.accent.gradient}`;
    }
    if (theme.accent && Array.isArray(theme.accent.gradient)) {
      return `bg-gradient-to-r ${theme.accent.gradient.join(' ')}`;
    }
    return 'bg-gradient-to-r from-indigo-500 to-purple-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        ref={modalRef}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-slideUp ${getBg()} ${getBorder()} border`}
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div className={`sticky top-0 flex justify-between items-center p-4 border-b z-10 ${getBg()} ${getBorder()}`}>
          <div className="flex items-center gap-2">
            <FaCamera className="text-indigo-500" />
            <h2 className={`text-xl font-semibold ${getTextPrimary()}`}>
              {step === 'upload' && 'Create New Reel'}
              {step === 'details' && 'Reel Details'}
              {step === 'processing' && 'Uploading...'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className={`p-2 rounded-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
            style={{ color: theme.text.secondary }}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging ? 'scale-105' : ''
                } ${getBg()} ${getBorder()}`}
                style={{ 
                  borderColor: isDragging ? '#6366f1' : undefined,
                  backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.15)' : undefined,
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {videoPreview ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={videoPreview}
                      className="max-h-64 rounded-lg mx-auto"
                      onClick={handlePlayPause}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause();
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                        {isPlaying ? (
                          <FaPause className="text-white text-xl" />
                        ) : (
                          <FaPlay className="text-white text-xl ml-1" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setVideoPreview(null);
                        setDuration(0);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      <FaTrash className="text-white text-sm" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-xs">
                      {formatDuration(duration)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isDragging ? 'scale-110' : ''} transition-transform`}
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                    >
                      <FaVideo className="text-4xl text-indigo-500" />
                    </div>
                    <p className={`text-sm font-medium ${getTextSecondary()}`}>
                      {isDragging ? 'Drop your video here' : 'Drag & drop your video here'}
                    </p>
                    <p className={`text-xs mt-1 ${getTextMuted()}`}>
                      or click to browse files
                    </p>
                    <p className={`text-xs mt-2 ${getTextMuted()}`}>
                      MP4, MOV, AVI, MKV, WEBM (Max 100MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Thumbnail Section */}
              {videoPreview && (
                <div className={`flex flex-wrap items-center gap-3 p-3 rounded-lg ${getBg()}`}>
                  <span className={`text-sm font-medium ${getTextSecondary()}`}>
                    Thumbnail:
                  </span>
                  <button
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:scale-105 flex items-center gap-2 ${getBg()} ${getBorder()} border`}
                    style={{ 
                      color: theme.text.secondary
                    }}
                  >
                    <FaImage className="text-sm" />
                    Upload Image
                  </button>
                  <button
                    onClick={captureThumbnail}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:scale-105 flex items-center gap-2 ${getBg()} ${getBorder()} border`}
                    style={{ 
                      color: theme.text.secondary
                    }}
                  >
                    <FaCamera className="text-sm" />
                    Capture from Video
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailSelect}
                  />
                  {thumbnailPreview && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-500">
                      <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setThumbnail(null);
                          setThumbnailPreview(null);
                        }}
                        className="absolute top-0 right-0 p-0.5 rounded-bl-lg bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <FaTimes className="text-white text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Next Button */}
              {videoPreview && (
                <button
                  onClick={() => setStep('details')}
                  className={`w-full py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 text-white ${getGradientClass()}`}
                >
                  Next → Add Details
                </button>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${getTextSecondary()}`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter reel title..."
                  maxLength={200}
                  className={`w-full px-4 py-2 rounded-lg outline-none transition-colors ${getBg()} ${getBorder()} border`}
                  style={{ 
                    color: theme.text.primary
                  }}
                  autoFocus
                />
                <p className={`text-xs mt-1 ${getTextMuted()}`}>
                  {title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${getTextSecondary()}`}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's your reel about?"
                  rows={3}
                  maxLength={1000}
                  className={`w-full px-4 py-2 rounded-lg outline-none resize-none transition-colors ${getBg()} ${getBorder()} border`}
                  style={{ 
                    color: theme.text.primary
                  }}
                />
                <p className={`text-xs mt-1 ${getTextMuted()}`}>
                  {description.length}/1000 characters
                </p>
              </div>

              {/* Video Info */}
              <div className={`flex gap-4 p-3 rounded-lg ${getBg()}`}>
                <div>
                  <p className={`text-xs ${getTextMuted()}`}>File</p>
                  <p className={`text-sm font-medium ${getTextSecondary()}`}>
                    {selectedFile?.name}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${getTextMuted()}`}>Duration</p>
                  <p className={`text-sm font-medium ${getTextSecondary()}`}>
                    {formatDuration(duration)}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${getTextMuted()}`}>Size</p>
                  <p className={`text-sm font-medium ${getTextSecondary()}`}>
                    {(selectedFile ? selectedFile.size / (1024 * 1024) : 0).toFixed(1)} MB
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${getTextSecondary()}`}>
                  Privacy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'public', label: 'Public', icon: FaGlobe, description: 'Everyone can see' },
                    { value: 'friends', label: 'Friends', icon: FaUserFriends, description: 'Only friends' },
                    { value: 'only_me', label: 'Only Me', icon: FaLock, description: 'Just you' },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = privacy === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setPrivacy(option.value as any)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg text-sm font-medium transition-all ${
                          isSelected ? 'scale-105' : 'hover:scale-105'
                        } ${isSelected ? 'bg-indigo-500 text-white' : getBg()}`}
                        style={{
                          color: isSelected ? '#fff' : theme.text.secondary,
                          border: `1px solid ${isSelected ? '#6366f1' : theme.surface.border}`,
                        }}
                      >
                        <Icon className={`text-lg ${isSelected ? 'text-white' : ''}`} />
                        <span>{option.label}</span>
                        <span className={`text-xs ${isSelected ? 'text-white/80' : getTextMuted()}`}>
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings */}
              <div className={`flex flex-col gap-3 p-3 rounded-lg ${getBg()}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span className={`text-sm ${getTextSecondary()}`}>
                    Allow comments
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSharing}
                    onChange={(e) => setAllowSharing(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span className={`text-sm ${getTextSecondary()}`}>
                    Allow sharing
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-3 pt-4 border-t ${getBorder()}`}>
                <button
                  onClick={() => setStep('upload')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors hover:scale-105 ${getBg()} ${getBorder()} border`}
                  style={{ 
                    color: theme.text.secondary
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    title.trim() ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                  } flex items-center justify-center gap-2 text-white ${getGradientClass()}`}
                >
                  <FaUpload className="text-sm" />
                  Upload Reel
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaUpload className="text-2xl" style={{ color: '#6366f1' }} />
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${getTextPrimary()}`}>
                  Uploading Your Reel
                </h3>
                <p className={`text-sm ${getTextSecondary()}`}>
                  Please wait while we process your video...
                </p>
              </div>
              <div className="w-full max-w-xs mx-auto">
                <div className={`w-full h-2 rounded-full overflow-hidden ${getBg()}`} style={{ backgroundColor: theme.surface.border }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      backgroundColor: '#6366f1'
                    }}
                  />
                </div>
                <p className={`text-sm font-medium mt-2 ${getTextSecondary()}`}>
                  {uploadProgress}% complete
                </p>
              </div>
              {uploadProgress === 100 && (
                <div className="flex items-center justify-center gap-2" style={{ color: '#22c55e' }}>
                  <FaCheck className="text-xl" />
                  <span className="font-medium">Upload complete! Finalizing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}