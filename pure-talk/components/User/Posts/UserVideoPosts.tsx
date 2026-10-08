'use client';

import React, { useEffect, useState } from 'react';
import { videoActions, getFullMediaUrl, type Video } from '@/app/services/videos/actions';
import type { ThemeColors } from '@/context/theme';

export default function UserVideoPosts({ theme, userId, feed = false }: { theme: ThemeColors; userId?: number; feed?: boolean }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const request = feed ? videoActions.getFeed() : videoActions.getVideos(userId ? { user: userId } : undefined);
    request.then(result => {
      if (!active) return;
      setVideos((result.success && Array.isArray(result.data) ? result.data : []).filter(video => feed || !userId || video.user === userId));
      setLoading(false);
    });
    return () => { active = false; };
  }, [userId]);

  if (loading) return <p className={`text-sm ${theme.text.muted}`}>Loading videos...</p>;
  if (!videos.length) return null;

  return (
    <section className="mt-6 space-y-3">
      <h2 className={`text-lg font-semibold ${theme.text.primary}`}>{feed ? 'Videos' : 'Video posts'}</h2>
      <div className="space-y-4">
        {videos.map(video => {
          const blocked = video.is_blocked;
          return (
            <article key={video.id} className={`relative overflow-hidden rounded-xl ${theme.surface.border} ${blocked ? 'opacity-60 grayscale' : ''}`}>
              {blocked ? (
                <div className="p-8 text-center">
                  <p className={`font-semibold ${theme.text.primary}`}>This video is unavailable</p>
                  <p className={`mt-1 text-sm ${theme.text.muted}`}>This video was blocked because it violates the community rules.</p>
                  {video.blocked_reason && <p className={`mt-1 text-xs ${theme.text.muted}`}>Reason: {video.blocked_reason}</p>}
                </div>
              ) : (
                <>
                  <video controls preload="metadata" className="max-h-[420px] w-full bg-black" poster={getFullMediaUrl(video.thumbnail_url) || undefined}>
                    <source src={getFullMediaUrl(video.video_url || video.video_file) || ''} />
                  </video>
                  <div className="p-4">
                    <h3 className={`font-semibold ${theme.text.primary}`}>{video.title}</h3>
                    {video.description && <p className={`mt-1 text-sm ${theme.text.secondary}`}>{video.description}</p>}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
