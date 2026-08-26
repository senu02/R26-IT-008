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
      <div className="w-full max-w-[320px] relative rounded-3xl overflow-hidden bg-[#1e1040]/90 border border-pink-500/30 backdrop-blur-xl p-5 shadow-[0_10px_35px_rgba(99,60,180,0.4)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b5e] via-[#1a1040] to-[#0f0a2e] opacity-95 pointer-events-none" />
        <div className="absolute inset-0 bg-sidebar-dark-pattern opacity-30 pointer-events-none" />
        <div className="relative z-10 flex flex-col text-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-slate-800/80 animate-pulse ring-2 ring-rose-500/30"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-800/80 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-800/80 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] relative rounded-3xl overflow-hidden bg-[#1e1040]/90 border border-pink-500/30 backdrop-blur-xl p-5 shadow-[0_10px_35px_rgba(99,60,180,0.4)] text-slate-100 transition-all duration-300">
      {/* Warm Indigo-Rose Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b5e] via-[#1a1040] to-[#0f0a2e] opacity-95 pointer-events-none" />
      <div className="absolute inset-0 bg-sidebar-dark-pattern opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-sidebar-grid-pattern opacity-20 pointer-events-none" />

      {/* Ambient Glows — pink + blue friendly tones */}
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-pink-500/25 blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none animate-pulse-slow delay-1000" />

      <div className="relative z-10 h-full flex flex-col">
        {/* Current user */}
        <div className="mb-5 flex items-center justify-between p-2.5 rounded-2xl bg-white/10 border border-white/15 shadow-inner backdrop-blur-md">
          <div className="flex min-w-0 cursor-pointer items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-pink-400/50 shadow-[0_0_12px_rgba(236,72,153,0.4)]">
              <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex flex-col text-sm">
              <span title={userName} className="truncate font-bold text-white tracking-wide">{userName}</span>
              <span className="truncate text-xs text-slate-300">{fullName}</span>
            </div>
          </div>
          <button type="button" className="shrink-0 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors px-2 py-1 rounded-lg hover:bg-pink-500/15">
            Switch
          </button>
        </div>

        {/* Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-rose-400/90 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Friend Requests
              </span>
              <Link href="/friends" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {pendingRequests.slice(0, 5).map((req) => {
                const from = req.from_user_detail;
                return (
                  <div key={req.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#2a1752]/50 border border-pink-500/20 hover:border-pink-400/40 transition-all">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-pink-400/40">
                        <img
                          src={safeGetImageUrl(from?.profile_picture)}
                          alt={from?.full_name || 'user'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="truncate text-xs font-semibold text-slate-100">{from?.full_name || 'Unknown'}</span>
                        <span className="truncate text-[10px] text-slate-300">Requested to follow</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        disabled={actionLoading[req.id]}
                        onClick={() => handleAccept(req.id)}
                        className="rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] disabled:opacity-50 hover:brightness-110 transition-all"
                      >
                        {actionLoading[req.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading[req.id]}
                        onClick={() => handleReject(req.id)}
                        className="rounded-lg bg-[#382068] px-2 py-1 text-[11px] font-medium text-slate-200 disabled:opacity-50 hover:bg-[#472982] transition-colors"
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
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">Suggestions for you</span>
          <Link href="/friends" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
            See all
          </Link>
        </div>

        <div
          className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(236,72,153,0.3) transparent' }}
        >
          {suggestions.length === 0 ? (
            <div className="text-xs text-slate-300 py-3 text-center bg-[#2a1752]/50 rounded-xl border border-pink-500/20">
              No suggestions right now
            </div>
          ) : (
            suggestions.slice(0, 4).map((s) => (
              <div key={s.user.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#2a1752]/40 border border-pink-500/20 hover:bg-[#2a1752]/70 hover:border-pink-400/40 transition-all">
                <Link href={`/profile/${s.user.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-pink-400/30">
                    <img
                      src={safeGetImageUrl(s.user.profile_picture)}
                      alt={s.user.full_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="truncate text-xs font-semibold text-slate-100 hover:text-pink-300 transition-colors">{s.user.full_name}</span>
                    <span className="w-full max-w-[150px] truncate text-[10px] text-slate-300">
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
                  className="shrink-0 text-xs font-bold text-pink-400 hover:text-pink-300 disabled:opacity-50 px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 transition-all border border-pink-500/25"
                >
                  {actionLoading[s.user.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 flex flex-col gap-2.5 text-[11px] font-normal text-[var(--text-footer)] border-t border-slate-800/80">
          <div className="flex flex-wrap gap-x-2.5 gap-y-1">
            <a href="#" className="hover:text-slate-200 transition-colors">About</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Help</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Press</a>
            <a href="#" className="hover:text-slate-200 transition-colors">API</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Jobs</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Terms</a>
          </div>
          <span className="uppercase text-[10px] tracking-widest text-slate-600 font-bold">© {new Date().getFullYear()} PURETALK</span>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;