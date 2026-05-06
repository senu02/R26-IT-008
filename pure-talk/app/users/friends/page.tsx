"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, UserX, Users, X, Sparkles, Compass } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

// Mock Data
const MOCK_USERS = [
  { id: 1, full_name: 'Alice Johnson', email: 'alice@example.com', profile_picture: null },
  { id: 2, full_name: 'Bob Smith', email: 'bob@example.com', profile_picture: null },
  { id: 3, full_name: 'Charlie Brown', email: 'charlie@example.com', profile_picture: null },
  { id: 4, full_name: 'Diana Prince', email: 'diana@example.com', profile_picture: null },
  { id: 5, full_name: 'Evan Wright', email: 'evan@example.com', profile_picture: null },
];

const MOCK_FRIENDS = [
  { id: 1, friend: 101, friend_detail: { id: 101, full_name: 'Sarah Parker', email: 'sarah@example.com', profile_picture: null } },
  { id: 2, friend: 102, friend_detail: { id: 102, full_name: 'Mike Ross', email: 'mike@example.com', profile_picture: null } },
];

const MOCK_REQUESTS = [
  { id: 1, from_user_detail: { id: 201, full_name: 'Emma Watson', email: 'emma@example.com', profile_picture: null }, created_at: '2024-01-01' },
  { id: 2, from_user_detail: { id: 202, full_name: 'John Doe', email: 'john@example.com', profile_picture: null }, created_at: '2024-01-02' },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'requests' | 'friends'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [discoverUsers, setDiscoverUsers] = useState(MOCK_USERS);
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const handleSendRequest = async (userId: number) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    setDiscoverUsers(prev => prev.filter(u => u.id !== userId));
    setActionLoading(prev => ({ ...prev, [userId]: false }));
  };

  const handleAcceptRequest = async (reqId: number) => {
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    const acceptedReq = requests.find(r => r.id === reqId);
    if (acceptedReq) {
      const newFriend = {
        id: Date.now(),
        friend: acceptedReq.from_user_detail.id,
        friend_detail: acceptedReq.from_user_detail
      };
      setFriends(prev => [...prev, newFriend]);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    }
    setActionLoading(prev => ({ ...prev, [reqId]: false }));
  };

  const handleRejectRequest = async (reqId: number) => {
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    setRequests(prev => prev.filter(r => r.id !== reqId));
    setActionLoading(prev => ({ ...prev, [reqId]: false }));
  };

  const handleRemoveFriend = async (friendId: number) => {
    setActionLoading(prev => ({ ...prev, [friendId]: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    setFriends(prev => prev.filter(f => f.friend !== friendId));
    const removedFriend = friends.find(f => f.friend === friendId);
    if (removedFriend) {
      setDiscoverUsers(prev => [...prev, removedFriend.friend_detail]);
    }
    setActionLoading(prev => ({ ...prev, [friendId]: false }));
  };

  const getImageUrl = (url: string | null | undefined): string => {
    return url || PLACEHOLDER_AVATAR;
  };

  const filteredDiscover = discoverUsers.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(f => 
    (f.friend_detail?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {/* Search Bar */}
          <div className="relative mb-8 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#fd297b] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search people by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border border-[var(--ig-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#fd297b]/50 focus:border-[#fd297b]/50 shadow-sm transition-all text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
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
            />
            <TabButton 
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')}
              icon={<UserPlus size={18} />}
              label="Requests"
              badge={requests.length > 0 ? requests.length : undefined}
            />
            <TabButton 
              active={activeTab === 'friends'} 
              onClick={() => setActiveTab('friends')}
              icon={<Users size={18} />}
              label="My Friends"
              badge={friends.length > 0 ? friends.length : undefined}
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
                    filteredDiscover.map(user => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        getImageUrl={getImageUrl}
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
                    <EmptyState icon={<Sparkles size={48} />} title="No new faces found" desc="You seem to know everyone or try a different search!" />
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
                  {requests.length > 0 ? (
                    requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--ig-border)] bg-[var(--background)] hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <img 
                            src={getImageUrl(req.from_user_detail?.profile_picture)} 
                            alt="avatar" 
                            className="w-14 h-14 rounded-full object-cover border border-[var(--ig-border)]"
                          />
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-base">{req.from_user_detail?.full_name || 'User'}</p>
                            <p className="text-xs text-[var(--ig-muted)]">Sent you a friend request</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ActionButton 
                            icon={<UserCheck size={16} />} 
                            label="Accept" 
                            onClick={() => handleAcceptRequest(req.id)}
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
                    <EmptyState icon={<UserCheck size={48} />} title="No pending requests" desc="You're all caught up! Go discover some new people." />
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
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(f => (
                      <UserCard 
                        key={f.id} 
                        user={f.friend_detail} 
                        getImageUrl={getImageUrl}
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
                    <EmptyState icon={<Users size={48} />} title="It's a little quiet here" desc="Add some friends to see them appear on this list." />
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
function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
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
      {badge && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#fd297b] text-[10px] font-bold text-white">
          {badge}
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

function UserCard({ user, actionBtn, getImageUrl }: { user: any, actionBtn: React.ReactNode, getImageUrl: (url: string | null | undefined) => string }) {
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

function ActionButton({ icon, label, onClick, loading, variant }: { icon: React.ReactNode, label: string, onClick: () => void, loading?: boolean, variant: 'primary' | 'secondary' | 'danger' }) {
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
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
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