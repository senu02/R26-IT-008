"use client";
import React, { useState, useEffect } from 'react';
import { getCurrentUserData, getImageUrl, userAPI, friendsAPI, type User } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const RightSidebar = () => {
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [userName, setUserName] = useState('azevedo_drdr');
  const [fullName, setFullName] = useState('Azevedo');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [requested, setRequested] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchSidebarData = async () => {
      const currentUser = getCurrentUserData();
      if (currentUser) {
        setUserAvatar(getImageUrl(currentUser.profile_picture) || 'https://i.pravatar.cc/150?img=11');
        setUserName(currentUser.full_name?.toLowerCase().replace(/\s/g, '_') || currentUser.email?.split('@')[0] || 'user');
        setFullName(currentUser.full_name || 'User');
        
        try {
          const [usersRes, friendsRes] = await Promise.all([
            userAPI.getAllUsers(),
            friendsAPI.list()
          ]);
          
          const friendsList = friendsRes.results || [];
          const friendIds = new Set(friendsList.map(f => f.friend));
          
          // Filter out self and existing friends
          const discoverList = (Array.isArray(usersRes) ? usersRes : []).filter(u => u.id !== currentUser.id && !friendIds.has(u.id));
          
          // Take top 5 for sidebar
          setSuggestions(discoverList.slice(0, 5));
        } catch (error) {
          console.error("Failed to load suggestions:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchSidebarData();
  }, []);

  const handleSendRequest = async (userId: number) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await friendsAPI.sendRequest(userId);
      setRequested(prev => ({ ...prev, [userId]: true }));
    } catch (error) {
      console.error("Failed to send request", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="flex w-full max-w-[320px] flex-col text-sm text-[var(--foreground)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex min-w-0 cursor-pointer items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[var(--ig-border)]">
            <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col text-sm">
            <span className="truncate font-semibold">{userName}</span>
            <span className="truncate text-[var(--ig-muted)]">{fullName}</span>
          </div>
        </div>
        <button type="button" className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:opacity-80">
          Switch
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-[var(--ig-muted)]">Suggestions for you</span>
        <Link href="/friends" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70">
          See all
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-[var(--ig-muted)]" size={20} />
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 cursor-pointer items-center gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <img src={getImageUrl(user.profile_picture) || 'https://i.pravatar.cc/150?img=11'} alt={user.full_name || 'User'} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="truncate text-sm font-semibold hover:opacity-70">{user.full_name || 'User'}</span>
                  <span className="w-full max-w-[180px] truncate text-xs text-[var(--ig-muted)]">Suggested for you</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleSendRequest(user.id)}
                disabled={actionLoading[user.id] || requested[user.id]}
                className={`shrink-0 text-xs font-semibold transition-colors ${
                  requested[user.id] 
                    ? 'text-[var(--ig-muted)] cursor-not-allowed' 
                    : 'text-[var(--ig-link)] hover:opacity-80'
                }`}
              >
                {actionLoading[user.id] ? <Loader2 className="animate-spin" size={14} /> : requested[user.id] ? 'Requested' : 'Follow'}
              </button>
            </div>
          ))
        ) : (
          <div className="text-xs text-[var(--ig-muted)]">No suggestions at the moment.</div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 text-xs font-normal text-[var(--ig-muted)]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">
            About
          </a>
          <a href="#" className="hover:underline">
            Help
          </a>
          <a href="#" className="hover:underline">
            Press
          </a>
          <a href="#" className="hover:underline">
            API
          </a>
          <a href="#" className="hover:underline">
            Jobs
          </a>
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <a href="#" className="hover:underline">
            Locations
          </a>
          <a href="#" className="hover:underline">
            Language
          </a>
        </div>
        <span className="uppercase tracking-wide">© {new Date().getFullYear()} PureTalk</span>
      </div>
    </div>
  );
};

export default RightSidebar;
