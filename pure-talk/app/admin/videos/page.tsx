// app/admin/videos/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { FaSearch, FaTrash, FaTimes, FaVideo, FaExclamationTriangle, FaUpload } from 'react-icons/fa';
import { BiBlock } from 'react-icons/bi';
import StatsCards from '@/components/Admin/Videos/StatsCards';
import VideoTable from '@/components/Admin/Videos/VideoTable';
import VideoScanResults from '@/components/Admin/Videos/VideoScanResults';
import { videoActions, canAdmin, canModerate, formatDate as formatDateUtil, getFullMediaUrl, type VideoTextScan } from '@/app/services/videos/actions';
import { useToast } from '@/context/toast'; // Adjust path as needed

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  privacy: 'public' | 'friends' | 'only_me';
  allow_comments: boolean;
  allow_sharing: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  flagged_at: string | null;
  is_blocked: boolean;
  analysis_status?: string;
  suggested_action?: string;
  blocked_reason: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    profile_picture: string | null;
    role: string;
    account_status: string;
  };
}

export default function AdminVideosPage() {
  const { colors, theme } = useThemeColors();
  const { showSuccess, showError } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'blocked' | 'normal'>('all');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'friends' | 'only_me'>('all');
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [textScan, setTextScan] = useState<VideoTextScan | null>(null);
  const [loadingTextScan, setLoadingTextScan] = useState(false);
  const [scanningText, setScanningText] = useState(false);
  const scanRequestId = useRef(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [adminVideoFile, setAdminVideoFile] = useState<File | null>(null);
  const [adminVideoTitle, setAdminVideoTitle] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const isAdmin = canAdmin();
  const isMod = canModerate();

  useEffect(() => {
    const requestId = ++scanRequestId.current;
    setTextScan(null);
    setScanningText(false);
    if (!showDetailsModal || !selectedVideo) {
      setLoadingTextScan(false);
      return;
    }

    let active = true;
    setLoadingTextScan(true);
    videoActions.getVideoTextScan(selectedVideo.id).then((result) => {
      if (!active || requestId !== scanRequestId.current) return;
      setLoadingTextScan(false);
      if (result.success) {
        setTextScan(result.data || null);
      } else {
        showError(result.error || 'Could not load the saved video text scan.');
      }
    });

    return () => {
      active = false;
    };
  }, [showDetailsModal, selectedVideo, showError]);

  useEffect(() => {
    fetchVideos();
  }, [statusFilter, privacyFilter]);

  const fetchVideos = async () => {
    setLoading(true);
    
    const params: any = {};
    
    if (statusFilter === 'flagged') {
      params.flagged = 'true';
    } else if (statusFilter === 'blocked') {
      params.blocked = 'true';
    } else if (statusFilter === 'normal') {
      params.flagged = 'false';
      params.blocked = 'false';
    }
    
    if (search) {
      params.search = search;
    }
    
    try {
      const result = await videoActions.getVideos(params);
      
      if (result.success && result.data) {
        const transformedVideos = (result.data as any[]).map((v: any) => {
          const userData = v.user_details || {};
          const videoUrl = getFullMediaUrl(v.video_url || v.video_file);
          const thumbnailUrl = getFullMediaUrl(v.thumbnail_url || v.thumbnail);
          const profilePicture = userData.profile_picture 
            ? getFullMediaUrl(userData.profile_picture)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || userData.email || 'User')}&background=6366f1&color=fff&length=2&bold=true`;
          
          return {
            id: v.id,
            title: v.title,
            description: v.description || '',
            video_url: videoUrl || '',
            thumbnail_url: thumbnailUrl,
            duration: v.duration || 0,
            views_count: v.views_count || 0,
            likes_count: v.likes_count || 0,
            comments_count: v.comments_count || 0,
            shares_count: v.shares_count || 0,
            privacy: v.privacy || 'public',
            allow_comments: v.allow_comments !== false,
            allow_sharing: v.allow_sharing !== false,
            is_flagged: v.is_flagged || false,
            flagged_reason: v.flagged_reason || null,
            flagged_at: v.flagged_at || null,
            is_blocked: v.is_blocked || false,
            analysis_status: v.analysis_status,
            suggested_action: v.suggested_action,
            blocked_reason: v.blocked_reason || null,
            blocked_at: v.blocked_at || null,
            created_at: v.created_at,
            updated_at: v.updated_at,
            user: {
              id: userData.id || v.user,
              email: userData.email || '',
              full_name: userData.full_name || userData.email?.split('@')[0] || 'Unknown User',
              profile_picture: profilePicture,
              role: userData.role || 'user',
              account_status: userData.account_status || 'active',
            },
          };
        });
        setVideos(transformedVideos);
        showSuccess(`Loaded ${transformedVideos.length} videos successfully`);
      } else {
        showError(result.error || 'Failed to fetch videos');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showError('Network error: Unable to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchVideos();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  const stats = {
    total: videos.length,
    flagged: videos.filter(v => v.is_flagged && !v.is_blocked).length,
    blocked: videos.filter(v => v.is_blocked).length,
    public: videos.filter(v => v.privacy === 'public').length,
  };

  const handleBlockVideo = async (video: Video, reason: string) => {
    if (!isAdmin) {
      showError('Only admins can block videos');
      return;
    }
    
    try {
      const result = await videoActions.blockVideo(video.id, reason);
      
      if (result.success) {
        setVideos(videos.map(v => v.id === video.id ? {
          ...v,
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString()
        } : v));
        setShowBlockModal(false);
        setBlockReason('');
        setSelectedVideo(null);
        showSuccess(`Video "${video.title}" has been blocked successfully`);
      } else {
        showError(result.error || 'Failed to block video');
      }
    } catch (error) {
      showError('Network error: Unable to block video');
    }
  };

  const handleUnblockVideo = async (video: Video) => {
    if (!isAdmin) {
      showError('Only admins can unblock videos');
      return;
    }
    
    try {
      const result = await videoActions.unblockVideo(video.id);
      
      if (result.success) {
        setVideos(videos.map(v => v.id === video.id ? {
          ...v,
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null
        } : v));
        showSuccess(`Video "${video.title}" has been unblocked successfully`);
      } else {
        showError(result.error || 'Failed to unblock video');
      }
    } catch (error) {
      showError('Network error: Unable to unblock video');
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    if (confirm(`Are you sure you want to delete "${video.title}"? This action cannot be undone.`)) {
      try {
        const result = await videoActions.deleteVideo(video.id);
        
        if (result.success) {
          setVideos(videos.filter(v => v.id !== video.id));
          setSelectedVideos(selectedVideos.filter(id => id !== video.id));
          showSuccess(`Video "${video.title}" has been deleted successfully`);
        } else {
          showError(result.error || 'Failed to delete video');
        }
      } catch (error) {
        showError('Network error: Unable to delete video');
      }
    }
  };

  const handleScanVideoText = async () => {
    if (!selectedVideo) return;
    const requestId = ++scanRequestId.current;
    setLoadingTextScan(false);
    setScanningText(true);
    setTextScan(null);
    const result = await videoActions.scanVideoToxicity(selectedVideo.id);
    if (requestId !== scanRequestId.current) return;
    if (result.success && result.data) {
      setTextScan(result.data);
      await fetchVideos();
      if (result.data.status === 'complete') showSuccess('Video text and audio scan completed');
      else showError(result.data.error || 'Video analysis incomplete. Review the available evidence.');
    } else {
      showError(result.error || 'Failed to analyse video');
    }
    setScanningText(false);
  };

  const handleAdminUpload = async () => {
    if (!adminVideoFile || !adminVideoTitle.trim()) {
      showError('Select a video and enter a title.');
      return;
    }
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('title', adminVideoTitle.trim());
    formData.append('description', 'Uploaded from the admin video workspace.');
    formData.append('video_file', adminVideoFile);
    formData.append('privacy', 'public');
    formData.append('allow_comments', 'true');
    formData.append('allow_sharing', 'true');
    const result = await videoActions.uploadVideo(formData);
    setUploadingVideo(false);
    if (!result.success) {
      showError(result.error || 'Failed to upload video');
      return;
    }
    showSuccess('Video uploaded successfully.');
    setShowUploadModal(false);
    setAdminVideoFile(null);
    setAdminVideoTitle('');
    fetchVideos();
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedVideos.length} video(s)? This action cannot be undone.`)) {
      let successCount = 0;
      let failCount = 0;
      const deletedTitles: string[] = [];
      
      for (const videoId of selectedVideos) {
        const video = videos.find(v => v.id === videoId);
        try {
          const result = await videoActions.deleteVideo(videoId);
          if (result.success) {
            successCount++;
            if (video) deletedTitles.push(video.title);
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        setVideos(videos.filter(v => !selectedVideos.includes(v.id)));
        setSelectedVideos([]);
        showSuccess(`${successCount} video(s) deleted successfully`);
      }
      
      if (failCount > 0) {
        showError(`Failed to delete ${failCount} video(s)`);
      }
    }
  };

  const handleBulkBlock = async () => {
    if (!isAdmin) {
      showError('Only admins can block videos');
      return;
    }
    
    const reason = prompt(`Enter reason for blocking ${selectedVideos.length} video(s):`);
    if (reason) {
      let successCount = 0;
      let failCount = 0;
      
      for (const videoId of selectedVideos) {
        try {
          const result = await videoActions.blockVideo(videoId, reason);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        setVideos(videos.map(v => selectedVideos.includes(v.id) ? {
          ...v,
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString()
        } : v));
        setSelectedVideos([]);
        showSuccess(`${successCount} video(s) blocked successfully`);
      }
      
      if (failCount > 0) {
        showError(`Failed to block ${failCount} video(s)`);
      }
    }
  };

  const handleResolveFlag = async (video: Video) => {
    if (!isMod) {
      showError('Only moderators can resolve flags');
      return;
    }
    
    try {
      const result = await videoActions.resolveFlag(video.id);
      
      if (result.success) {
        setVideos(videos.map(v => v.id === video.id ? {
          ...v,
          is_flagged: false,
          flagged_reason: null,
          flagged_at: null
        } : v));
        showSuccess(`Flag resolved for video "${video.title}"`);
      } else {
        showError(result.error || 'Failed to resolve flag');
      }
    } catch (error) {
      showError('Network error: Unable to resolve flag');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedVideos(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVideos.length === filteredVideos.length) {
      setSelectedVideos([]);
      showSuccess('All videos deselected');
    } else {
      setSelectedVideos(filteredVideos.map(v => v.id));
      showSuccess(`${filteredVideos.length} videos selected`);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
                          video.user.email.toLowerCase().includes(search.toLowerCase()) ||
                          video.user.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesPrivacy = privacyFilter === 'all' || video.privacy === privacyFilter;
    return matchesSearch && matchesPrivacy;
  });

  const getBackgroundStyle = () => {
    if (theme === 'space') {
      return {
        background: 'radial-gradient(ellipse at top, #0a1628, #050b14)',
        position: 'relative' as const,
        overflow: 'hidden' as const,
      };
    }
    return { backgroundColor: colors.background.primary };
  };

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={getBackgroundStyle()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4" style={{ color: colors.text.secondary }}>Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={getBackgroundStyle()}>
      {theme === 'space' && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                background: 'white',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.7 + 0.3,
                animationDelay: Math.random() * 5 + 's',
              }}
            />
          ))}
        </div>
      )}

      <div className="mb-6 relative z-10">
        <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Video Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Moderate, block, and manage all videos on your platform
          </p>
          <button onClick={() => setShowUploadModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}>
            <FaUpload /> Upload Video
          </button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="rounded-xl p-4 mb-6 relative z-10 backdrop-blur-sm" style={{ 
        backgroundColor: theme === 'space' ? 'rgba(13, 20, 37, 0.8)' : colors.surface.primary, 
        border: `1px solid ${colors.border.primary}` 
      }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
            <input
              type="text"
              placeholder="Search by title, email, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
            >
              <option value="all">All Status</option>
              <option value="flagged">Flagged</option>
              <option value="blocked">Blocked</option>
              <option value="normal">Normal</option>
            </select>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
            >
              <option value="all">All Privacy</option>
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only Me</option>
            </select>
            <button
              onClick={fetchVideos}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary.main, color: '#fff' }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {selectedVideos.length > 0 && (
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between relative z-10 backdrop-blur-sm" style={{ 
          backgroundColor: theme === 'space' ? 'rgba(99, 102, 241, 0.15)' : colors.primary.main + '15', 
          border: `1px solid ${colors.primary.main}` 
        }}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{selectedVideos.length} selected</span>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={handleBulkBlock}
                className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-all hover:scale-105"
                style={{ backgroundColor: colors.status.warning + '20', color: colors.status.warning }}
              >
                <BiBlock className="w-3 h-3" /> Block
              </button>
            )}
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-all hover:scale-105"
              style={{ backgroundColor: colors.status.error + '20', color: colors.status.error }}
            >
              <FaTrash className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden relative z-10 backdrop-blur-sm" style={{ 
        backgroundColor: theme === 'space' ? 'rgba(13, 20, 37, 0.8)' : colors.surface.primary, 
        border: `1px solid ${colors.border.primary}` 
      }}>
        <VideoTable
          videos={filteredVideos}
          selectedVideos={selectedVideos}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onViewDetails={(video) => {
            setSelectedVideo(video);
            setShowDetailsModal(true);
          }}
          onBlock={isAdmin ? (video) => {
            setSelectedVideo(video);
            setShowBlockModal(true);
          } : undefined}
          onUnblock={isAdmin ? handleUnblockVideo : undefined}
          onDelete={handleDeleteVideo}
          onResolveFlag={isMod ? handleResolveFlag : undefined}
        />
      </div>

      {/* Video Details Modal */}
      {showDetailsModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl" style={{ backgroundColor: colors.surface.primary }}>
            <div className="sticky top-0 flex justify-between items-center p-4 border-b" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.primary }}>
              <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Video Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded hover:bg-black/10 transition-colors">
                <FaTimes style={{ color: colors.text.secondary }} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedVideo.video_url ? (
                <div className="rounded-lg overflow-hidden bg-black relative">
                  <video 
                    key={selectedVideo.video_url}
                    controls 
                    autoPlay={false}
                    className="w-full max-h-[400px] object-contain"
                    poster={selectedVideo.thumbnail_url || undefined}
                  >
                    <source src={selectedVideo.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {selectedVideo.is_flagged && (
                    <div className="absolute top-2 right-2 px-3 py-1 rounded-md bg-amber-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm z-10">
                      <FaExclamationTriangle className="w-3.5 h-3.5" /> Toxic Image / Content Flagged
                    </div>
                  )}
                </div>
              ) : selectedVideo.thumbnail_url ? (
                <div className="rounded-lg overflow-hidden bg-black relative">
                  <img 
                    src={selectedVideo.thumbnail_url} 
                    alt={selectedVideo.title}
                    className="w-full max-h-[350px] object-contain mx-auto"
                  />
                  {selectedVideo.is_flagged && (
                    <div className="absolute top-2 right-2 px-3 py-1 rounded-md bg-amber-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm z-10">
                      <FaExclamationTriangle className="w-3.5 h-3.5" /> Toxic Image Flagged
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-800 p-8 text-center">
                  <FaExclamationTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <p style={{ color: colors.text.secondary }}>Media file not available</p>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>{selectedVideo.title}</h3>
                <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>{selectedVideo.description || 'No description'}</p>
              </div>

              {isMod && (
                <div className="p-3 rounded-lg border" style={{ borderColor: colors.border.primary, backgroundColor: colors.background.primary }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>Video toxicity scan</p>
                      <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>Checks on-screen text and spoken audio using the existing toxicity detectors. Longer videos may take a few minutes.</p>
                    </div>
                    <button
                      onClick={handleScanVideoText}
                      disabled={scanningText}
                      className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}
                    >
                      {scanningText ? 'Analysing video...' : 'Scan text and audio'}
                    </button>
                  </div>

                  {loadingTextScan && (
                    <p className="mt-3 text-xs" style={{ color: colors.text.secondary }}>
                      Loading saved video scan...
                    </p>
                  )}

                  {textScan && <VideoScanResults scan={textScan} />}
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.primary }}>
                <div className="relative">
                  <img 
                    src={selectedVideo.user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedVideo.user.full_name)}&background=6366f1&color=fff&length=2&bold=true`}
                    alt={selectedVideo.user.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2" 
                    style={{ borderColor: colors.primary.main }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedVideo.user.full_name)}&background=6366f1&color=fff&length=2&bold=true`;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: colors.text.primary }}>{selectedVideo.user.full_name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                      backgroundColor: selectedVideo.user.role === 'admin' || selectedVideo.user.role === 'super_admin' ? colors.status.error + '20' : 
                                     selectedVideo.user.role === 'moderator' ? colors.status.warning + '20' : 
                                     colors.status.info + '20',
                      color: selectedVideo.user.role === 'admin' || selectedVideo.user.role === 'super_admin' ? colors.status.error : 
                             selectedVideo.user.role === 'moderator' ? colors.status.warning : 
                             colors.status.info
                    }}>
                      {selectedVideo.user.role === 'super_admin' ? 'Super Admin' : selectedVideo.user.role}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>{selectedVideo.user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: colors.background.primary }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{selectedVideo.views_count.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>Views</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: colors.background.primary }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{selectedVideo.likes_count.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>Likes</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: colors.background.primary }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{selectedVideo.comments_count.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>Comments</p>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ backgroundColor: colors.background.primary }}>
                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{selectedVideo.shares_count.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>Shares</p>
                </div>
              </div>
              
              {selectedVideo.is_flagged && (
                <div className="p-3.5 rounded-lg border border-amber-500/30" style={{ backgroundColor: colors.status.warning + '20' }}>
                  <div className="flex items-center gap-2 font-bold text-sm" style={{ color: colors.status.warning }}>
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span>⚠️ Toxic Image / Content Flagged for Moderation</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>Reason: {selectedVideo.flagged_reason || 'Flagged by toxicity detection system'}</p>
                  {selectedVideo.flagged_at && (
                    <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>Flagged at: {formatDateUtil(selectedVideo.flagged_at)}</p>
                  )}
                </div>
              )}
              
              {selectedVideo.is_blocked && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.status.error + '20' }}>
                  <p className="text-sm font-medium" style={{ color: colors.status.error }}>🔒 Blocked Information</p>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>Reason: {selectedVideo.blocked_reason || 'No reason provided'}</p>
                  <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>Blocked at: {formatDateUtil(selectedVideo.blocked_at!)}</p>
                </div>
              )}
              
              <div className="text-xs" style={{ color: colors.text.tertiary }}>
                <p>Created: {formatDateUtil(selectedVideo.created_at)}</p>
                <p>Updated: {formatDateUtil(selectedVideo.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !uploadingVideo && setShowUploadModal(false)}>
          <div className="w-full max-w-md rounded-xl p-5 space-y-4" style={{ backgroundColor: colors.surface.primary }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Upload Video</h2>
              <button onClick={() => !uploadingVideo && setShowUploadModal(false)} className="p-1 rounded hover:bg-black/10"><FaTimes style={{ color: colors.text.secondary }} /></button>
            </div>
            <input
              value={adminVideoTitle}
              onChange={(event) => setAdminVideoTitle(event.target.value)}
              placeholder="Video title"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
            />
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
              onChange={(event) => setAdminVideoFile(event.target.files?.[0] || null)}
              className="w-full text-sm"
              style={{ color: colors.text.secondary }}
            />
            {adminVideoFile && <p className="text-xs" style={{ color: colors.text.secondary }}>{adminVideoFile.name}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowUploadModal(false)} disabled={uploadingVideo} className="px-3 py-2 rounded-lg text-sm" style={{ color: colors.text.secondary }}>Cancel</button>
              <button onClick={handleAdminUpload} disabled={uploadingVideo} className="px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: colors.primary.main, color: colors.primary.contrast }}>
                {uploadingVideo ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl" style={{ backgroundColor: colors.surface.primary }}>
            <div className="p-4 border-b" style={{ borderColor: colors.border.primary }}>
              <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Block Video</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm" style={{ color: colors.text.secondary }}>Are you sure you want to block "{selectedVideo.title}"?</p>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Reason for blocking</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.primary }}
                  placeholder="Enter reason for blocking this video..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                    setSelectedVideo(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.primary}`, color: colors.text.secondary }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBlockVideo(selectedVideo, blockReason)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: colors.status.error, color: '#fff' }}
                >
                  Block Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
