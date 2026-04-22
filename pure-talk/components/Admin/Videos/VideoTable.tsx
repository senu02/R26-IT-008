// app/admin/videos/components/VideoTable.tsx

'use client';

import React from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { FaEye, FaTrash, FaCalendar, FaVideo, FaUnlock, FaFlag, FaCheck } from 'react-icons/fa';
import { BiBlock } from 'react-icons/bi';
import { FaGlobe, FaUsers, FaLock } from 'react-icons/fa';

interface Video {
  id: number;
  title: string;
  description: string;
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
  blocked_reason: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
  video_url: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    profile_picture: string | null;
    role: string;
    account_status: string;
  };
}

interface VideoTableProps {
  videos: Video[];
  selectedVideos: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onViewDetails: (video: Video) => void;
  onBlock?: (video: Video) => void;
  onUnblock?: (video: Video) => void;
  onDelete: (video: Video) => void;
  onResolveFlag?: (video: Video) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRoleColor = (role: string, colors: any) => {
  if (role === 'admin' || role === 'super_admin') {
    return { bg: colors.status.error + '20', text: colors.status.error };
  }
  if (role === 'moderator') {
    return { bg: colors.status.warning + '20', text: colors.status.warning };
  }
  return { bg: colors.status.info + '20', text: colors.status.info };
};

const getAvatarUrl = (user: Video['user'], colors: any) => {
  if (user.profile_picture) {
    return user.profile_picture;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=6366f1&color=fff&length=2&bold=true`;
};

export default function VideoTable({
  videos,
  selectedVideos,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onBlock,
  onUnblock,
  onDelete,
  onResolveFlag,
}: VideoTableProps) {
  const { colors } = useThemeColors();

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <FaVideo className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: colors.text.tertiary }} />
        <p style={{ color: colors.text.secondary }}>No videos found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border.primary}` }}>
            <th className="p-3 text-left w-12">
              <input
                type="checkbox"
                checked={selectedVideos.length === videos.length && videos.length > 0}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded"
              />
            </th>
            <th className="p-3 text-left">Video</th>
            <th className="p-3 text-left">Creator</th>
            <th className="p-3 text-left">Views</th>
            <th className="p-3 text-left">Privacy</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => {
            const roleColors = getRoleColor(video.user.role, colors);
            const avatarUrl = getAvatarUrl(video.user, colors);
            const displayName = video.user.full_name || video.user.email.split('@')[0];
            
            return (
              <tr key={video.id} style={{ borderBottom: `1px solid ${colors.border.primary}` }} className="hover:bg-black/5 transition-colors">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={() => onToggleSelect(video.id)}
                    className="w-4 h-4 rounded"
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-black">
                      {video.thumbnail_url ? (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/120x68?text=No+Thumbnail';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.surface.tertiary }}>
                          <FaVideo className="w-6 h-6" style={{ color: colors.text.tertiary }} />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 px-1 text-[10px] bg-black/80 text-white rounded-tl">{formatDuration(video.duration)}</div>
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1 max-w-[200px]" style={{ color: colors.text.primary }}>{video.title}</p>
                      <p className="text-xs mt-1 line-clamp-1 max-w-[200px]" style={{ color: colors.text.secondary }}>{video.description?.substring(0, 50)}</p>
                      {video.is_flagged && !video.is_blocked && (
                        <span className="inline-flex items-center gap-1 text-xs mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.status.warning + '20', color: colors.status.warning }}>
                          <FaFlag className="w-2 h-2" /> Flagged
                        </span>
                      )}
                      {video.is_blocked && (
                        <span className="inline-flex items-center gap-1 text-xs mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.status.error + '20', color: colors.status.error }}>
                          <FaLock className="w-2 h-2" /> Blocked
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img 
                        src={avatarUrl}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&length=2&bold=true`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate max-w-[120px]" style={{ color: colors.text.primary }}>
                          {displayName}
                        </span>
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap capitalize"
                          style={{ backgroundColor: roleColors.bg, color: roleColors.text }}
                        >
                          {video.user.role === 'super_admin' ? 'Super Admin' : video.user.role}
                        </span>
                      </div>
                      <span className="text-xs block truncate max-w-[150px]" style={{ color: colors.text.secondary }}>
                        {video.user.email}
                      </span>
                      {video.user.account_status !== 'active' && (
                        <span className="text-[10px] inline-block mt-0.5 px-1 py-0 rounded" style={{ 
                          backgroundColor: video.user.account_status === 'suspended' ? colors.status.warning + '20' : colors.status.error + '20',
                          color: video.user.account_status === 'suspended' ? colors.status.warning : colors.status.error
                        }}>
                          {video.user.account_status}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FaEye className="w-3 h-3" style={{ color: colors.text.tertiary }} />
                    <span className="text-xs font-medium" style={{ color: colors.text.primary }}>{formatNumber(video.views_count)}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-xs px-2 py-1 rounded-full capitalize flex items-center gap-1 w-fit" style={{
                    backgroundColor: video.privacy === 'public' ? colors.status.success + '20' : video.privacy === 'friends' ? colors.status.info + '20' : colors.status.warning + '20',
                    color: video.privacy === 'public' ? colors.status.success : video.privacy === 'friends' ? colors.status.info : colors.status.warning
                  }}>
                    {video.privacy === 'public' && <FaGlobe className="w-2 h-2" />}
                    {video.privacy === 'friends' && <FaUsers className="w-2 h-2" />}
                    {video.privacy === 'only_me' && <FaLock className="w-2 h-2" />}
                    {video.privacy === 'only_me' ? 'Only Me' : video.privacy}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <FaCalendar className="w-3 h-3" style={{ color: colors.text.tertiary }} />
                    <span className="text-xs" style={{ color: colors.text.secondary }}>{formatDate(video.created_at)}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onViewDetails(video)}
                      className="p-1.5 rounded hover:bg-black/10 transition-colors" 
                      style={{ color: colors.text.secondary }}
                      title="View Details"
                    >
                      <FaEye size={14} />
                    </button>
                    
                    {onResolveFlag && video.is_flagged && !video.is_blocked && (
                      <button 
                        onClick={() => onResolveFlag(video)}
                        className="p-1.5 rounded hover:bg-black/10 transition-colors" 
                        style={{ color: colors.status.success }}
                        title="Resolve Flag"
                      >
                        <FaCheck size={14} />
                      </button>
                    )}
                    
                    {onBlock && !video.is_blocked && (
                      <button 
                        onClick={() => onBlock(video)}
                        className="p-1.5 rounded hover:bg-black/10 transition-colors" 
                        style={{ color: colors.status.warning }}
                        title="Block Video"
                      >
                        <BiBlock size={14} />
                      </button>
                    )}
                    
                    {onUnblock && video.is_blocked && (
                      <button 
                        onClick={() => onUnblock(video)}
                        className="p-1.5 rounded hover:bg-black/10 transition-colors" 
                        style={{ color: colors.status.success }}
                        title="Unblock Video"
                      >
                        <FaUnlock size={14} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onDelete(video)} 
                      className="p-1.5 rounded hover:bg-black/10 transition-colors" 
                      style={{ color: colors.status.error }}
                      title="Delete Video"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}