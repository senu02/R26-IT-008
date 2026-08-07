// components/Home/RightSidebar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getCurrentUserData, getImageUrl } from '@/lib/api';
import {
  getPendingRequests,
  getFriendSuggestions,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  FriendRequest,
  FriendSuggestion,
} from '@/app/services/friends/actions';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

const safeGetImageUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) return PLACEHOLDER_AVATAR;
  const url = getImageUrl(profilePicture);
  return url || PLACEHOLDER_AVATAR;
};

const RightSidebar = () => {
  const [userAvatar, setUserAvatar] = useState(PLACEHOLDER_AVATAR);
  const [userName, setUserName] = useState('user');
  const [fullName, setFullName] = useState('User');

  const [token, setToken] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const currentUser = getCurrentUserData();

    console.log('RightSidebar - Auth token found:', !!authToken);
    console.log('RightSidebar - Current user:', currentUser);

    setToken(authToken);

    if (currentUser) {
      setUserAvatar(safeGetImageUrl(currentUser.profile_picture));
      setUserName(
        currentUser.full_name?.toLowerCase().replace(/\s/g, '_') ||
          currentUser.email?.split('@')[0] ||
          'user'
      );
      setFullName(currentUser.full_name || 'User');
    }

    if (authToken) {
      loadData(authToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (authToken: string) => {
    setLoading(true);
    try {
      console.log('RightSidebar - Loading data...');
      
      // Try to get suggestions first
      let suggestionsData = await getFriendSuggestions(authToken);
      console.log('Raw suggestions data:', suggestionsData);
      
      // If suggestions is empty, try to get discover users as fallback
      if (!suggestionsData || suggestionsData.length === 0) {
        console.log('No suggestions from API, trying alternative method...');
        
        // Import getDiscoverUsers dynamically
        const { getDiscoverUsers } = await import('@/app/services/friends/actions');
        const discoverUsers = await getDiscoverUsers(authToken);
        console.log('Discover users:', discoverUsers);
        
        // Convert discover users to suggestions format
        if (discoverUsers && discoverUsers.length > 0) {
          suggestionsData = discoverUsers.map((user: any) => ({
            user: user,
            mutual_friends_count: 0,
            mutual_friends: []
          }));
          console.log('Converted discover users to suggestions:', suggestionsData);
        }
      }
      
      // Get pending requests
      const requestsData = await getPendingRequests(authToken);
      console.log('Pending requests:', requestsData);
      
      // Update state
      setSuggestions(suggestionsData || []);
      setPendingRequests(requestsData || []);
      
      console.log('Final suggestions count:', suggestionsData?.length || 0);
      console.log('Final pending requests count:', requestsData?.length || 0);
      
    } catch (err) {
      console.error('RightSidebar - Failed to load data:', err);
      setSuggestions([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reqId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await acceptFriendRequest(token, reqId);
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleReject = async (reqId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await rejectFriendRequest(token, reqId);
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleFollow = async (userId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await sendFriendRequest(token, userId);
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
    } catch (err) {
      console.error('Failed to send friend request:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[320px] text-sm text-[var(--foreground)] relative h-full">
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--ig-border)]"></div>
        <div className="pl-4 h-full flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[var(--ig-hover)] animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-[var(--ig-hover)] rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-[var(--ig-hover)] rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--ig-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] text-sm text-[var(--foreground)] relative h-full">
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--ig-border)]"></div>

      <div className="pl-4 h-full flex flex-col">
        {/* Current user */}
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

        {/* Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-[var(--ig-muted)]">Friend Requests</span>
              <Link href="/friends" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70">
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {pendingRequests.slice(0, 5).map((req) => {
                const from = req.from_user_detail;
                return (
                  <div key={req.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                        <img
                          src={safeGetImageUrl(from?.profile_picture)}
                          alt={from?.full_name || 'user'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="truncate text-sm font-semibold">{from?.full_name || 'Unknown'}</span>
                        <span className="truncate text-xs text-[var(--ig-muted)]">Requested to follow</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={actionLoading[req.id]}
                        onClick={() => handleAccept(req.id)}
                        className="rounded-md bg-[#0095f6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#1877f2] transition-colors"
                      >
                        {actionLoading[req.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading[req.id]}
                        onClick={() => handleReject(req.id)}
                        className="rounded-md bg-[var(--ig-border)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-[var(--ig-hover)] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold text-[var(--ig-muted)]">Suggestions for you</span>
          <Link href="/friends" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70">
            See all
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {suggestions.length === 0 ? (
            <div className="text-xs text-[var(--ig-muted)] py-2">
              No suggestions right now
            </div>
          ) : (
            suggestions.slice(0, 5).map((s) => (
              <div key={s.user.id} className="flex items-center justify-between gap-2">
                <Link href={`/profile/${s.user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <img
                      src={safeGetImageUrl(s.user.profile_picture)}
                      alt={s.user.full_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate text-sm font-semibold hover:opacity-70">{s.user.full_name}</span>
                    <span className="w-full max-w-[180px] truncate text-xs text-[var(--ig-muted)]">
                      {s.mutual_friends_count > 0
                        ? `${s.mutual_friends_count} mutual friend${s.mutual_friends_count > 1 ? 's' : ''}`
                        : 'Suggested for you'}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={actionLoading[s.user.id]}
                  onClick={() => handleFollow(s.user.id)}
                  className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:opacity-80 disabled:opacity-50"
                >
                  {actionLoading[s.user.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 flex flex-col gap-3 text-xs font-normal text-[var(--ig-muted)]">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Help</a>
            <a href="#" className="hover:underline">Press</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">Jobs</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Locations</a>
            <a href="#" className="hover:underline">Language</a>
          </div>
          <span className="uppercase tracking-wide">© {new Date().getFullYear()} PureTalk</span>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;