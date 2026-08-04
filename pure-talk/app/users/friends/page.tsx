// app/friends/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, UserX, Users, X, Sparkles, Compass, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Home/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';
import {
  getFriendsList,
  getPendingRequests,
  getFriendSuggestions,
  getDiscoverUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  User,
  FriendRequest,
  Friendship,
  FriendSuggestion,
} from '@/app/services/friends/actions';
import { getImageUrl, getCurrentUserData } from '@/lib/api';

// Import Toast
import { ToastProvider, useToast } from '@/context/userToast';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

// Helper function to safely get image URL
const safeGetImageUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) return PLACEHOLDER_AVATAR;
  const url = getImageUrl(profilePicture);
  return url || PLACEHOLDER_AVATAR;
};

// Main Component Content
const FriendsPageContent = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Get token from localStorage
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize toast
  const toast = useToast();

  // Load token and user data on mount
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    const userData = getCurrentUserData();
    setToken(authToken);
    setCurrentUser(userData);
    
    if (authToken) {
      loadInitialData(authToken);
    } else {
      setError('Please login to view friends');
      setLoading(false);
    }
  }, []);

  const loadInitialData = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const [friendsData, requestsData, suggestionsData, discoverData] = await Promise.all([
        getFriendsList(authToken),
        getPendingRequests(authToken),
        getFriendSuggestions(authToken),
        getDiscoverUsers(authToken),
      ]);
      
      setFriends(friendsData);
      setRequests(requestsData);
      setSuggestions(suggestionsData);
      
      if (discoverData && discoverData.length > 0) {
        setDiscoverUsers(discoverData);
      } else {
        const suggestedUsers = suggestionsData.map(s => s.user);
        setDiscoverUsers(suggestedUsers);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.status === 401) {
        setError('Session expired. Please login again.');
        toast.showInstagramToast(
          'Session expired. Please login again.',
          'System',
          undefined,
          'like'
        );
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.message || 'Failed to load data');
        toast.showInstagramToast(
          'Failed to load friends data',
          'System',
          undefined,
          'like'
        );
      }
      
      try {
        const [friendsData, requestsData] = await Promise.all([
          getFriendsList(authToken),
          getPendingRequests(authToken),
        ]);
        setFriends(friendsData);
        setRequests(requestsData);
      } catch (fallbackErr) {
        console.error('Fallback loading also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!token) return;
    
    if (query.trim()) {
      try {
        const results = await searchUsers(token, query);
        const friendIds = new Set(friends.map(f => f.friend));
        const requestIds = new Set(requests.map(r => r.from_user));
        
        const filteredResults = results.results.filter(user => 
          !friendIds.has(user.id) && 
          !requestIds.has(user.id) &&
          user.id !== currentUser?.id
        );
        
        setDiscoverUsers(filteredResults);
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.message);
      }
    } else {
      try {
        const discoverData = await getDiscoverUsers(token);
        if (discoverData && discoverData.length > 0) {
          setDiscoverUsers(discoverData);
        } else {
          const suggestionsData = await getFriendSuggestions(token);
          setDiscoverUsers(suggestionsData.map(s => s.user));
        }
      } catch (err) {
        console.error('Error resetting discover users:', err);
      }
    }
  };

  const handleSendRequest = async (userId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await sendFriendRequest(token, userId);
      setDiscoverUsers(prev => prev.filter(u => u.id !== userId));
      setError(null);
      
      const user = discoverUsers.find(u => u.id === userId);
      
      toast.showInstagramToast(
        'sent you a friend request! 🤝',
        user?.full_name || 'Someone',
        user?.profile_picture ? safeGetImageUrl(user.profile_picture) : undefined,
        'follow'
      );
    } catch (err: any) {
      console.error('Error sending request:', err);
      setError(err.message || 'Failed to send friend request');
      toast.showInstagramToast(
        'Failed to send friend request',
        'System',
        undefined,
        'like'
      );
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAcceptRequest = async (reqId: number, fromUser: User) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await acceptFriendRequest(token, reqId);
      
      const newFriendship: Friendship = {
        id: Date.now(),
        friend: fromUser.id,
        friend_detail: fromUser,
        created_at: new Date().toISOString(),
      };
      setFriends(prev => [...prev, newFriendship]);
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setError(null);
      
      toast.showInstagramToast(
        'accepted your friend request! 🎉',
        fromUser.full_name || 'Someone',
        fromUser.profile_picture ? safeGetImageUrl(fromUser.profile_picture) : undefined,
        'follow'
      );
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError(err.message || 'Failed to accept friend request');
      toast.showInstagramToast(
        'Failed to accept friend request',
        'System',
        undefined,
        'like'
      );
    } finally {
      setActionLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleRejectRequest = async (reqId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await rejectFriendRequest(token, reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setError(null);
      
      toast.showInstagramToast(
        'Friend request declined',
        'You',
        undefined,
        'like'
      );
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const getFilteredDiscover = () => {
    if (!searchQuery.trim()) return discoverUsers;
    
    return discoverUsers.filter((user: User) => 
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredRequests = () => {
    if (!searchQuery.trim()) return requests;
    
    return requests.filter((r: FriendRequest) => 
      (r.from_user_detail?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredDiscover = getFilteredDiscover();
  const filteredRequestsList = getFilteredRequests();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-[var(--background)]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#fd297b]" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen w-full bg-[var(--background)]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Please login to access friends page</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white rounded-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans overflow-hidden">
      {/* Left Sidebar - Fixed Width, Hidden on Mobile */}
      <aside className="hidden md:block w-[72px] lg:w-[245px] shrink-0 h-full">
        <Sidebar />
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 flex justify-center min-w-0 px-4 md:px-6 py-4 md:py-6 overflow-y-auto h-full scrollbar-hide">
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
          
          {/* Instagram-style Header */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-[var(--foreground)] hover:opacity-70 transition-opacity">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-semibold">Discover People</h1>
            </div>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--ig-border)] hover:border-[#fd297b] transition-colors"
            >
              <img 
                src={safeGetImageUrl(currentUser?.profile_picture)} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          {/* Instagram-style Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[var(--ig-muted)]" />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--ig-hover)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ig-muted)] transition-all text-sm placeholder:text-[var(--ig-muted)]"
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--ig-muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Instagram-style Tabs */}
          <div className="flex border-b border-[var(--ig-border)] mb-4">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'discover' 
                  ? 'text-[var(--foreground)]' 
                  : 'text-[var(--ig-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Discover
              {activeTab === 'discover' && (
                <motion.div 
                  layoutId="igTabIndicator" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'requests' 
                  ? 'text-[var(--foreground)]' 
                  : 'text-[var(--ig-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Requests
              {filteredRequestsList.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-[#fd297b] rounded-full">
                  {filteredRequestsList.length}
                </span>
              )}
              {activeTab === 'requests' && (
                <motion.div 
                  layoutId="igTabIndicator" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]"
                />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Content Area */}
          <div className="relative">
            <AnimatePresence mode="wait">
              
              {/* DISCOVER TAB */}
              {activeTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  {filteredDiscover.length > 0 ? (
                    filteredDiscover.map((user: User) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between py-3 px-2 hover:bg-[var(--ig-hover)] rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={safeGetImageUrl(user.profile_picture)} 
                              alt={user.full_name || 'User'} 
                              className="w-11 h-11 rounded-full object-cover border border-[var(--ig-border)]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{user.full_name || 'User'}</p>
                            <p className="text-xs text-[var(--ig-muted)] truncate">{user.email || 'User'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={actionLoading[user.id]}
                          className="flex-shrink-0 ml-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0095f6] text-white hover:bg-[#1877f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[user.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Follow'
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                      <div className="w-16 h-16 bg-[var(--ig-hover)] rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-[var(--ig-muted)]" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">
                        {searchQuery ? "No users found" : "No suggestions"}
                      </h3>
                      <p className="text-sm text-[var(--ig-muted)] max-w-sm">
                        {searchQuery ? "Try a different search term" : "Check back later for new people to connect with!"}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* REQUESTS TAB */}
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  {filteredRequestsList.length > 0 ? (
                    filteredRequestsList.map((req: FriendRequest) => (
                      <div 
                        key={req.id} 
                        className="flex items-center justify-between py-3 px-2 hover:bg-[var(--ig-hover)] rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={safeGetImageUrl(req.from_user_detail?.profile_picture)} 
                              alt={req.from_user_detail?.full_name || 'User'} 
                              className="w-11 h-11 rounded-full object-cover border border-[var(--ig-border)]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{req.from_user_detail?.full_name || 'User'}</p>
                            <p className="text-xs text-[var(--ig-muted)] truncate">Requested to follow you</p>
                            {req.message && (
                              <p className="text-xs text-[var(--ig-muted)] truncate italic">"{req.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => req.from_user_detail && handleAcceptRequest(req.id, req.from_user_detail)}
                            disabled={actionLoading[req.id]}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0095f6] text-white hover:bg-[#1877f2] transition-colors disabled:opacity-50"
                          >
                            {actionLoading[req.id] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionLoading[req.id]}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--ig-hover)] text-[var(--foreground)] hover:bg-[var(--ig-border)] transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                      <div className="w-16 h-16 bg-[var(--ig-hover)] rounded-full flex items-center justify-center mb-4">
                        <UserCheck className="h-8 w-8 text-[var(--ig-muted)]" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">All caught up!</h3>
                      <p className="text-sm text-[var(--ig-muted)] max-w-sm">
                        No pending friend requests
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
          
        </div>
      </main>

      {/* Right Sidebar - Fixed Width, Hidden on Tablet/Mobile */}
      <aside className="hidden xl:block w-[320px] shrink-0 h-full">
        <div className="h-full overflow-y-auto py-6 pr-6 scrollbar-hide">
          <RightSidebar />
        </div>
      </aside>
    </div>
  );
};

// Export wrapped with ToastProvider
export default function FriendsPage() {
  return (
    <ToastProvider>
      <FriendsPageContent />
    </ToastProvider>
  );
}