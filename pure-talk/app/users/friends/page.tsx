<<<<<<< HEAD
'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/User/UserProfile/Sidebar';
import { BackgroundWrapper } from '@/context/theme';
=======
// app/friends/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, UserX, Users, X, Sparkles, Compass, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
import {
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Search,
  Users,
  Clock,
  MapPin,
  MoreHorizontal,
  Check,
  X,
  UserMinus,
  ChevronRight,
  Sparkles,
  Globe,
  Star,
} from 'lucide-react';
import { getCurrentUserData, getImageUrl, User } from '@/lib/api';

<<<<<<< HEAD
// ── Types ──────────────────────────────────────────────────────────────────
type FriendStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

interface Friend {
  id: number;
  name: string;
  avatar: string;
  mutualFriends: number;
  location?: string;
  status: FriendStatus;
  since?: string;       // for existing friends
  requestTime?: string; // for pending
  isOnline?: boolean;
}

type TabKey = 'all' | 'requests' | 'suggestions' | 'sent';

// ── Sample Data ────────────────────────────────────────────────────────────
const SAMPLE_FRIENDS: Friend[] = [
  { id: 1,  name: 'Sarah Johnson',  avatar: 'https://ui-avatars.com/api/?background=4a90e2&color=fff&size=128&name=Sarah+Johnson',  mutualFriends: 8,  location: 'New York, USA',     status: 'friends',           since: '2 years ago',          isOnline: true  },
  { id: 2,  name: 'Mike Chen',      avatar: 'https://ui-avatars.com/api/?background=34c759&color=fff&size=128&name=Mike+Chen',      mutualFriends: 5,  location: 'San Francisco, USA', status: 'friends',           since: '1 year ago',           isOnline: false },
  { id: 3,  name: 'Emma Wilson',    avatar: 'https://ui-avatars.com/api/?background=ff9500&color=fff&size=128&name=Emma+Wilson',    mutualFriends: 12, location: 'London, UK',        status: 'friends',           since: '3 years ago',          isOnline: true  },
  { id: 4,  name: 'Alex Turner',    avatar: 'https://ui-avatars.com/api/?background=af52de&color=fff&size=128&name=Alex+Turner',    mutualFriends: 3,  location: 'Toronto, Canada',   status: 'friends',           since: '6 months ago',         isOnline: false },
  { id: 5,  name: 'Priya Sharma',   avatar: 'https://ui-avatars.com/api/?background=fd297b&color=fff&size=128&name=Priya+Sharma',   mutualFriends: 7,  location: 'Mumbai, India',     status: 'friends',           since: '1 year ago',           isOnline: true  },
  { id: 6,  name: 'James Lee',      avatar: 'https://ui-avatars.com/api/?background=0a84ff&color=fff&size=128&name=James+Lee',      mutualFriends: 2,  location: 'Seoul, Korea',      status: 'friends',           since: '8 months ago',         isOnline: false },
];

const SAMPLE_REQUESTS: Friend[] = [
  { id: 10, name: 'Olivia Brown',   avatar: 'https://ui-avatars.com/api/?background=ff2d55&color=fff&size=128&name=Olivia+Brown',   mutualFriends: 6,  location: 'Austin, USA',       status: 'pending_received',  requestTime: '2 hours ago'   },
  { id: 11, name: 'Liam Martinez',  avatar: 'https://ui-avatars.com/api/?background=5ac8fa&color=fff&size=128&name=Liam+Martinez',  mutualFriends: 4,  location: 'Madrid, Spain',     status: 'pending_received',  requestTime: '1 day ago'     },
  { id: 12, name: 'Zara Khan',      avatar: 'https://ui-avatars.com/api/?background=ff9f0a&color=fff&size=128&name=Zara+Khan',      mutualFriends: 9,  location: 'Dubai, UAE',        status: 'pending_received',  requestTime: '3 days ago'    },
];

const SAMPLE_SENT: Friend[] = [
  { id: 20, name: 'Noah Williams',  avatar: 'https://ui-avatars.com/api/?background=30d158&color=fff&size=128&name=Noah+Williams',  mutualFriends: 3,  location: 'Chicago, USA',      status: 'pending_sent',      requestTime: '1 hour ago'    },
  { id: 21, name: 'Ava Thompson',   avatar: 'https://ui-avatars.com/api/?background=bf5af2&color=fff&size=128&name=Ava+Thompson',   mutualFriends: 7,  location: 'Paris, France',     status: 'pending_sent',      requestTime: '2 days ago'    },
];

const SAMPLE_SUGGESTIONS: Friend[] = [
  { id: 30, name: 'Ethan Davis',    avatar: 'https://ui-avatars.com/api/?background=64d2ff&color=fff&size=128&name=Ethan+Davis',    mutualFriends: 11, location: 'Los Angeles, USA',  status: 'none' },
  { id: 31, name: 'Sofia Garcia',   avatar: 'https://ui-avatars.com/api/?background=ff6961&color=fff&size=128&name=Sofia+Garcia',   mutualFriends: 5,  location: 'Barcelona, Spain',  status: 'none' },
  { id: 32, name: 'Lucas Müller',   avatar: 'https://ui-avatars.com/api/?background=77dd77&color=fff&size=128&name=Lucas+Muller',   mutualFriends: 8,  location: 'Berlin, Germany',   status: 'none' },
  { id: 33, name: 'Aisha Patel',    avatar: 'https://ui-avatars.com/api/?background=fdfd96&color=333&size=128&name=Aisha+Patel',    mutualFriends: 2,  location: 'Bangalore, India',  status: 'none' },
  { id: 34, name: 'Carlos Reyes',   avatar: 'https://ui-avatars.com/api/?background=c23b22&color=fff&size=128&name=Carlos+Reyes',   mutualFriends: 6,  location: 'Mexico City, MX',   status: 'none' },
  { id: 35, name: 'Yuna Kim',       avatar: 'https://ui-avatars.com/api/?background=b39eb5&color=fff&size=128&name=Yuna+Kim',       mutualFriends: 14, location: 'Tokyo, Japan',      status: 'none' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const glassCard = (isDark: boolean) =>
  isDark
    ? 'bg-white/5 backdrop-blur-md border border-white/10'
    : 'bg-white/40 backdrop-blur-md border border-white/50';

// ── Sub-components ─────────────────────────────────────────────────────────

function OnlineDot({ isOnline }: { isOnline?: boolean }) {
  if (!isOnline) return null;
  return (
    <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-black" />
  );
}

interface FriendCardProps {
  friend: Friend;
  isDark: boolean;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onCancelRequest?: (id: number) => void;
  onAddFriend?: (id: number) => void;
  onUnfriend?: (id: number) => void;
}

function FriendCard({ friend, isDark, onAccept, onDecline, onCancelRequest, onAddFriend, onUnfriend }: FriendCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const textPrimary   = isDark ? 'text-white'      : 'text-slate-900';
  const textSecondary = isDark ? 'text-white/60'   : 'text-slate-500';
  const hoverBg       = isDark ? 'hover:bg-white/10' : 'hover:bg-white/30';

  return (
    <div className={`rounded-2xl shadow-lg p-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${glassCard(isDark)}`}>
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={friend.avatar}
            alt={friend.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-[#fd297b]/30"
          />
          <OnlineDot isOnline={friend.isOnline} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm truncate ${textPrimary}`}>{friend.name}</h3>

          {friend.mutualFriends > 0 && (
            <p className={`text-xs flex items-center gap-1 mt-0.5 ${textSecondary}`}>
              <Users className="h-3 w-3" />
              {friend.mutualFriends} mutual friend{friend.mutualFriends > 1 ? 's' : ''}
            </p>
          )}

          {friend.location && (
            <p className={`text-xs flex items-center gap-1 mt-0.5 ${textSecondary}`}>
              <MapPin className="h-3 w-3" />
              {friend.location}
            </p>
          )}

          {(friend.since || friend.requestTime) && (
            <p className={`text-xs flex items-center gap-1 mt-0.5 ${textSecondary}`}>
              <Clock className="h-3 w-3" />
              {friend.since ?? friend.requestTime}
            </p>
          )}
        </div>

        {/* More menu (for existing friends) */}
        {friend.status === 'friends' && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className={`p-1.5 rounded-lg transition-all ${hoverBg} ${textSecondary}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className={`absolute right-0 top-8 z-20 w-44 rounded-xl shadow-2xl py-1 text-sm ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'}`}>
                <button
                  onClick={() => { onUnfriend?.(friend.id); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 transition-all`}
                >
                  <UserMinus className="h-4 w-4" /> Unfriend
                </button>
                <button className={`w-full flex items-center gap-2 px-4 py-2 ${textSecondary} ${hoverBg} transition-all`}>
                  <MessageCircle className="h-4 w-4" /> Message
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Existing friend */}
        {friend.status === 'friends' && (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#fd297b] text-white hover:bg-[#e01e6a] transition-all shadow">
            <MessageCircle className="h-3.5 w-3.5" /> Message
          </button>
        )}

        {/* Received request */}
        {friend.status === 'pending_received' && (
          <>
            <button
              onClick={() => onAccept?.(friend.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#fd297b] text-white hover:bg-[#e01e6a] transition-all shadow"
            >
              <Check className="h-3.5 w-3.5" /> Accept
            </button>
            <button
              onClick={() => onDecline?.(friend.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <X className="h-3.5 w-3.5" /> Decline
            </button>
          </>
        )}

        {/* Sent request */}
        {friend.status === 'pending_sent' && (
          <button
            onClick={() => onCancelRequest?.(friend.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <UserX className="h-3.5 w-3.5" /> Cancel Request
          </button>
        )}

        {/* Suggestion */}
        {friend.status === 'none' && (
          <button
            onClick={() => onAddFriend?.(friend.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#fd297b] text-white hover:bg-[#e01e6a] transition-all shadow"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Friend
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const [isDark, setIsDark]     = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch]     = useState('');
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);

  // Data state (so we can mutate without touching the constants)
  const [friends, setFriends]         = useState<Friend[]>(SAMPLE_FRIENDS);
  const [requests, setRequests]       = useState<Friend[]>(SAMPLE_REQUESTS);
  const [sent, setSent]               = useState<Friend[]>(SAMPLE_SENT);
  const [suggestions, setSuggestions] = useState<Friend[]>(SAMPLE_SUGGESTIONS);

=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const userData = getCurrentUserData();
    setUser(userData);
    setLoading(false);

    return () => observer.disconnect();
  }, []);

<<<<<<< HEAD
  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAccept = (id: number) => {
    const req = requests.find((r) => r.id === id);
    if (req) {
      setFriends((prev) => [...prev, { ...req, status: 'friends', since: 'Just now', isOnline: false }]);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDecline = (id: number) => setRequests((prev) => prev.filter((r) => r.id !== id));

  const handleCancelRequest = (id: number) => setSent((prev) => prev.filter((s) => s.id !== id));

  const handleAddFriend = (id: number) => {
    const sug = suggestions.find((s) => s.id === id);
    if (sug) {
      setSent((prev) => [...prev, { ...sug, status: 'pending_sent', requestTime: 'Just now' }]);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleUnfriend = (id: number) => setFriends((prev) => prev.filter((f) => f.id !== id));

  // ── Filtered lists ────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredFriends     = friends.filter((f) => f.name.toLowerCase().includes(q));
  const filteredRequests    = requests.filter((f) => f.name.toLowerCase().includes(q));
  const filteredSent        = sent.filter((f) => f.name.toLowerCase().includes(q));
  const filteredSuggestions = suggestions.filter((f) => f.name.toLowerCase().includes(q));

  // ── Tab config ────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'all',         label: 'All Friends',   count: friends.length,     icon: Users      },
    { key: 'requests',    label: 'Requests',       count: requests.length,    icon: UserPlus   },
    { key: 'sent',        label: 'Sent',           count: sent.length,        icon: UserCheck  },
    { key: 'suggestions', label: 'People You May Know', count: suggestions.length, icon: Sparkles },
  ];

  const textPrimary   = isDark ? 'text-white'    : 'text-slate-900';
  const textSecondary = isDark ? 'text-white/50' : 'text-slate-500';
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610

  if (loading) {
    return (
      <BackgroundWrapper isDark={isDark}>
        <Sidebar />
        <div className="flex-1 lg:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fd297b] mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading friends...</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
<<<<<<< HEAD
    <BackgroundWrapper isDark={isDark}>
      <Sidebar />

      <div className="flex-1 lg:ml-64 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
          {/* Mobile top spacing */}
          <div className="lg:hidden h-12" />

          {/* ── Page Header ─────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#fd297b]/20 to-[#ff655b]/20 mb-3">
              <Users className="h-4 w-4 text-[#fd297b]" />
              <span className="text-xs font-medium text-[#fd297b]">Friends</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#fd297b] to-[#ff655b] bg-clip-text text-transparent">
              Your Friends
            </h1>
            <p className={`mt-2 text-base ${textSecondary}`}>
              Manage your connections and discover new people
            </p>
          </div>

          {/* ── Stats Row ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Friends',    value: friends.length,     icon: Users,     color: 'from-[#fd297b] to-[#ff655b]' },
              { label: 'Pending Requests', value: requests.length,    icon: UserPlus,  color: 'from-blue-500 to-cyan-500'    },
              { label: 'Sent Requests',    value: sent.length,        icon: UserCheck, color: 'from-violet-500 to-purple-500' },
              { label: 'Suggestions',      value: suggestions.length, icon: Sparkles,  color: 'from-orange-500 to-yellow-500' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl shadow-lg p-4 flex items-center gap-3 ${glassCard(isDark)}`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</p>
                  <p className={`text-xs ${textSecondary}`}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search ──────────────────────────────────────────────── */}
          <div className={`relative mb-5 rounded-2xl shadow-lg flex items-center gap-3 px-4 py-3 ${glassCard(isDark)}`}>
            <Search className={`h-4 w-4 shrink-0 ${textSecondary}`} />
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 bg-transparent text-sm outline-none ${textPrimary} placeholder:${textSecondary}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`${textSecondary} hover:text-[#fd297b] transition-colors`}>
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

<<<<<<< HEAD
          {/* ── Tabs ────────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#fd297b] to-[#ff655b] text-white shadow-lg'
                    : isDark
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key
                      ? 'bg-white/30 text-white'
                      : 'bg-[#fd297b]/20 text-[#fd297b]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── ALL FRIENDS ─────────────────────────────────────────── */}
          {activeTab === 'all' && (
            <section>
              {filteredFriends.length === 0 ? (
                <EmptyState isDark={isDark} icon={Users} message="No friends found." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((f) => (
                    <FriendCard
                      key={f.id}
                      friend={f}
                      isDark={isDark}
                      onUnfriend={handleUnfriend}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── REQUESTS ────────────────────────────────────────────── */}
          {activeTab === 'requests' && (
            <section>
              {filteredRequests.length === 0 ? (
                <EmptyState isDark={isDark} icon={UserPlus} message="No pending friend requests." />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-base font-semibold ${textPrimary}`}>
                      Friend Requests <span className={textSecondary}>({filteredRequests.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRequests.map((f) => (
                      <FriendCard
                        key={f.id}
                        friend={f}
                        isDark={isDark}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                      />
                    ))}
                  </div>
                </>
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
              )}
            </section>
          )}

<<<<<<< HEAD
          {/* ── SENT ────────────────────────────────────────────────── */}
          {activeTab === 'sent' && (
            <section>
              {filteredSent.length === 0 ? (
                <EmptyState isDark={isDark} icon={UserCheck} message="No sent requests." />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-base font-semibold ${textPrimary}`}>
                      Sent Requests <span className={textSecondary}>({filteredSent.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSent.map((f) => (
                      <FriendCard
                        key={f.id}
                        friend={f}
                        isDark={isDark}
                        onCancelRequest={handleCancelRequest}
                      />
                    ))}
                  </div>
                </>
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
              )}
            </section>
          )}

<<<<<<< HEAD
          {/* ── SUGGESTIONS ─────────────────────────────────────────── */}
          {activeTab === 'suggestions' && (
            <section>
              {filteredSuggestions.length === 0 ? (
                <EmptyState isDark={isDark} icon={Sparkles} message="No suggestions right now. Check back later!" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-base font-semibold ${textPrimary}`}>
                      People You May Know <span className={textSecondary}>({filteredSuggestions.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuggestions.map((f) => (
                      <FriendCard
                        key={f.id}
                        friend={f}
                        isDark={isDark}
                        onAddFriend={handleAddFriend}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </BackgroundWrapper>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState({
  isDark,
  icon: Icon,
  message,
}: {
  isDark: boolean;
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className={`rounded-2xl p-12 text-center ${glassCard(isDark)}`}>
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#fd297b]/20 to-[#ff655b]/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-[#fd297b]" />
      </div>
      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{message}</p>
    </div>
=======
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
>>>>>>> b4e6d24b3cc3919d734ab50651e9dbaccbb04610
  );
}