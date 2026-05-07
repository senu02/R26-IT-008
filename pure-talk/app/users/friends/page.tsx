// app/friends/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, UserX, Users, X, Sparkles, Compass, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';
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

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'friends'>('discover');
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
      // Load all data in parallel
      const [friendsData, requestsData, suggestionsData, discoverData] = await Promise.all([
        getFriendsList(authToken),
        getPendingRequests(authToken),
        getFriendSuggestions(authToken),
        getDiscoverUsers(authToken),
      ]);
      
      setFriends(friendsData);
      setRequests(requestsData);
      setSuggestions(suggestionsData);
      
      // For discover tab, use discover API results first
      if (discoverData && discoverData.length > 0) {
        setDiscoverUsers(discoverData);
      } else {
        // Fallback to suggestions if no discover users
        const suggestedUsers = suggestionsData.map(s => s.user);
        setDiscoverUsers(suggestedUsers);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.status === 401) {
        setError('Session expired. Please login again.');
        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.message || 'Failed to load data');
      }
      
      // Fallback: try to load at least friends and requests
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
        // Filter out users who are already friends or have pending requests
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
      // Reset to discover users
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
      // Remove user from discover list
      setDiscoverUsers(prev => prev.filter(u => u.id !== userId));
      setError(null);
    } catch (err: any) {
      console.error('Error sending request:', err);
      setError(err.message || 'Failed to send friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAcceptRequest = async (reqId: number, fromUser: User) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await acceptFriendRequest(token, reqId);
      
      // Add to friends list
      const newFriendship: Friendship = {
        id: Date.now(),
        friend: fromUser.id,
        friend_detail: fromUser,
        created_at: new Date().toISOString(),
      };
      setFriends(prev => [...prev, newFriendship]);
      
      // Remove from requests
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setError(null);
    } catch (err: any) {
      console.error('Error accepting request:', err);
      setError(err.message || 'Failed to accept friend request');
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
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject friend request');
    } finally {
      setActionLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [friendId]: true }));
    try {
      await removeFriend(token, friendId);
      setFriends(prev => prev.filter(f => f.friend !== friendId));
      setError(null);
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.message || 'Failed to remove friend');
    } finally {
      setActionLoading(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const getUserImageUrl = (profilePicture: string | null | undefined): string => {
    const url = getImageUrl(profilePicture);
    return url || PLACEHOLDER_AVATAR;
  };

  // Filtered data - computed values
  const getFilteredDiscover = () => {
    if (!searchQuery.trim()) return discoverUsers;
    
    return discoverUsers.filter((user: User) => 
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredFriends = () => {
    if (!searchQuery.trim()) return friends;
    
    return friends.filter((f: Friendship) => 
      (f.friend_detail?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredRequests = () => {
    if (!searchQuery.trim()) return requests;
    
    return requests.filter((r: FriendRequest) => 
      (r.from_user_detail?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredDiscover = getFilteredDiscover();
  const filteredFriendsList = getFilteredFriends();
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
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-x-hidden">
      <Sidebar />
      
      <main className="flex w-full flex-1 justify-center pb-16 pt-0 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[800px] flex-col px-4 md:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 flex items-center gap-3">
              <Users className="text-[#fd297b]" size={36} />
              Connect & Discover
            </h1>
            <p className="text-[var(--ig-muted)] text-base">
              Find your people, manage your connections, and expand your network.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-8 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#fd297b] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search people by name or email..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#fd297b]/50 focus:border-[#fd297b]/50 shadow-sm transition-all text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-[var(--ig-border)] pb-2 overflow-x-auto scrollbar-none">
            <TabButton 
              active={activeTab === 'discover'} 
              onClick={() => setActiveTab('discover')}
              icon={<Compass size={18} />}
              label="Discover"
              badge={filteredDiscover.length > 0 ? filteredDiscover.length : undefined}
            />
            <TabButton 
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')}
              icon={<UserPlus size={18} />}
              label="Requests"
              badge={filteredRequestsList.length > 0 ? filteredRequestsList.length : undefined}
            />
            <TabButton 
              active={activeTab === 'friends'} 
              onClick={() => setActiveTab('friends')}
              icon={<Users size={18} />}
              label="My Friends"
              badge={filteredFriendsList.length > 0 ? filteredFriendsList.length : undefined}
            />
          </div>

          {/* Content Area */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* DISCOVER TAB */}
              {activeTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredDiscover.length > 0 ? (
                    filteredDiscover.map((user: User) => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        getImageUrl={getUserImageUrl}
                        actionBtn={
                          <ActionButton 
                            icon={<UserPlus size={16} />} 
                            label="Add Friend" 
                            onClick={() => handleSendRequest(user.id)}
                            loading={actionLoading[user.id]}
                            variant="primary"
                          />
                        }
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={<Sparkles size={48} />} 
                      title={searchQuery ? "No users found" : "No new faces found"} 
                      desc={searchQuery ? "Try a different search term" : "Check back later for new people to connect with!"} 
                    />
                  )}
                </motion.div>
              )}

              {/* REQUESTS TAB */}
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {filteredRequestsList.length > 0 ? (
                    filteredRequestsList.map((req: FriendRequest) => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--ig-border)] bg-[var(--background)] hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <img 
                            src={getUserImageUrl(req.from_user_detail?.profile_picture)} 
                            alt="avatar" 
                            className="w-14 h-14 rounded-full object-cover border border-[var(--ig-border)]"
                          />
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-base">{req.from_user_detail?.full_name || 'User'}</p>
                            <p className="text-xs text-[var(--ig-muted)]">Sent you a friend request</p>
                            {req.message && (
                              <p className="text-xs text-[var(--ig-muted)] mt-1 italic">"{req.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ActionButton 
                            icon={<UserCheck size={16} />} 
                            label="Accept" 
                            onClick={() => req.from_user_detail && handleAcceptRequest(req.id, req.from_user_detail)}
                            loading={actionLoading[req.id]}
                            variant="primary"
                          />
                          <ActionButton 
                            icon={<X size={16} />} 
                            label="Decline" 
                            onClick={() => handleRejectRequest(req.id)}
                            loading={actionLoading[req.id]}
                            variant="secondary"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState 
                      icon={<UserCheck size={48} />} 
                      title="No pending requests" 
                      desc="You're all caught up! Go discover some new people." 
                    />
                  )}
                </motion.div>
              )}

              {/* FRIENDS TAB */}
              {activeTab === 'friends' && (
                <motion.div
                  key="friends"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredFriendsList.length > 0 ? (
                    filteredFriendsList.map((f: Friendship) => (
                      <UserCard 
                        key={f.id} 
                        user={f.friend_detail!} 
                        getImageUrl={getUserImageUrl}
                        actionBtn={
                          <ActionButton 
                            icon={<UserX size={16} />} 
                            label="Remove" 
                            onClick={() => handleRemoveFriend(f.friend)}
                            loading={actionLoading[f.friend]}
                            variant="danger"
                          />
                        }
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={<Users size={48} />} 
                      title="It's a little quiet here" 
                      desc="Add some friends to see them appear on this list." 
                    />
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
          
        </div>
      </main>
    </div>
  );
}

// Subcomponents (same as before)
function TabButton({ active, onClick, icon, label, badge }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  badge?: number 
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
        active 
          ? 'text-[#fd297b] bg-[#fd297b]/10' 
          : 'text-[var(--ig-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#fd297b] text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="activeTabIndicator" 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#fd297b] to-[#ff655b] rounded-t-full"
        />
      )}
    </button>
  );
}

function UserCard({ user, actionBtn, getImageUrl }: { 
  user: User; 
  actionBtn: React.ReactNode; 
  getImageUrl: (url: string | null | undefined) => string 
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--ig-border)] bg-[var(--background)] hover:shadow-lg transition-all hover:-translate-y-0.5 group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative">
          <img 
            src={getImageUrl(user.profile_picture)} 
            alt={user.full_name || 'User'} 
            className="w-14 h-14 rounded-full object-cover border border-[var(--ig-border)] group-hover:border-[#fd297b]/50 transition-colors"
          />
        </div>
        <div className="min-w-0 flex flex-col">
          <p className="font-semibold text-[var(--foreground)] text-[15px] truncate max-w-[120px] sm:max-w-[160px]">{user.full_name || 'User'}</p>
          <p className="text-xs text-[var(--ig-muted)] truncate max-w-[120px] sm:max-w-[160px]">{user.email || '@user'}</p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {actionBtn}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, loading, variant }: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  loading?: boolean; 
  variant: 'primary' | 'secondary' | 'danger' 
}) {
  const baseClasses = "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95";
  let variantClasses = "";
  
  if (variant === 'primary') {
    variantClasses = "bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-md hover:shadow-lg hover:shadow-pink-500/20";
  } else if (variant === 'secondary') {
    variantClasses = "bg-black/5 dark:bg-white/10 text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/20";
  } else if (variant === 'danger') {
    variantClasses = "bg-red-500/10 text-red-500 hover:bg-red-500/20";
  }

  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ icon, title, desc }: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string 
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-16 px-4 bg-black/5 dark:bg-white/5 rounded-3xl border border-[var(--ig-border)] border-dashed">
      <div className="w-20 h-20 bg-gradient-to-br from-[#fd297b]/20 to-[#ff655b]/20 text-[#fd297b] rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--ig-muted)] max-w-sm">{desc}</p>
    </div>
  );
}