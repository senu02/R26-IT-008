"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';

const PLACEHOLDER_AVATAR = 'https://i.pravatar.cc/150?img=11';

// Mock Data
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'like', is_read: false, sender_name: 'Alice Johnson', sender_avatar: null, content: 'liked your photo', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 2, type: 'comment', is_read: false, sender_name: 'Bob Smith', sender_avatar: null, content: 'commented: "Awesome shot!"', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 3, type: 'follow', is_read: true, sender_name: 'Charlie Brown', sender_avatar: null, content: 'started following you', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 4, type: 'system', is_read: true, sender_name: null, sender_avatar: null, content: 'Welcome to the platform!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 5, type: 'mention', is_read: false, sender_name: 'Diana Prince', sender_avatar: null, content: 'mentioned you in a comment', created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // FIXED: Accepts null, undefined, or string
  const getImageUrl = (url: string | null | undefined): string => {
    return url || PLACEHOLDER_AVATAR;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-white" size={14} fill="currentColor" />;
      case 'comment': return <MessageCircle className="text-white" size={14} fill="currentColor" />;
      case 'mention': return <MessageCircle className="text-white" size={14} />;
      case 'follow': return <UserPlus className="text-white" size={14} />;
      case 'system': return <Info className="text-white" size={14} />;
      default: return <Bell className="text-white" size={14} />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'like': return 'bg-rose-500';
      case 'comment': return 'bg-blue-500';
      case 'mention': return 'bg-purple-500';
      case 'follow': return 'bg-[#fd297b]';
      case 'system': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-x-hidden">
      <Sidebar />
      
      <main className="flex w-full flex-1 justify-center pb-16 pt-0 relative z-10 md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[700px] flex-col px-4 md:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-8 border-b border-[var(--ig-border)] pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                <Bell className="text-[#fd297b]" size={32} fill="currentColor" />
                Notifications
              </h1>
              <p className="text-[var(--ig-muted)] text-sm md:text-base">
                Catch up on what you've missed.
              </p>
            </div>
            
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[var(--foreground)] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => setFilter('all')} 
              label="All Activity" 
            />
            <FilterButton 
              active={filter === 'unread'} 
              onClick={() => setFilter('unread')} 
              label="Unread" 
              badge={notifications.filter(n => !n.is_read).length || undefined}
            />
          </div>

          {/* Notifications List */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => (
                    <motion.div 
                      layout
                      key={notif.id}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        notif.is_read 
                          ? 'border-[var(--ig-border)] bg-[var(--background)] opacity-70 hover:opacity-100' 
                          : 'border-[#fd297b]/30 bg-[#fd297b]/5 hover:bg-[#fd297b]/10 shadow-sm'
                      }`}
                    >
                      {/* Avatar & Icon Badge */}
                      <div className="relative shrink-0">
                        {notif.type === 'system' ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center text-white shadow-lg">
                            <Bell size={24} />
                          </div>
                        ) : (
                          <img 
                            src={getImageUrl(notif.sender_avatar)} 
                            alt={notif.sender_name || 'User'} 
                            className="w-12 h-12 rounded-full object-cover border border-[var(--ig-border)]"
                          />
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--background)] shadow-sm ${getColorForType(notif.type)}`}>
                          {getIconForType(notif.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-[15px] leading-snug pr-8 text-[var(--foreground)]">
                          {notif.sender_name && <span className="font-bold mr-1.5">{notif.sender_name}</span>}
                          <span className={notif.is_read ? 'text-[var(--ig-muted)]' : ''}>{notif.content}</span>
                        </p>
                        <p className={`text-xs mt-1.5 font-medium ${notif.is_read ? 'text-[var(--ig-muted)]' : 'text-[#fd297b]'}`}>
                          {getTimeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Action (Mark as Read dot) */}
                      {!notif.is_read && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="shrink-0 group p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          title="Mark as read"
                        >
                          <div className="w-3 h-3 rounded-full bg-[#fd297b] group-hover:bg-transparent group-hover:border-2 group-hover:border-[var(--ig-muted)] transition-all" />
                        </button>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                      <Bell size={40} className="text-[var(--ig-muted)] opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Nothing to see here</h3>
                    <p className="text-sm text-[var(--ig-muted)] max-w-sm">
                      {filter === 'unread' 
                        ? "You've read all your notifications! Enjoy the peace and quiet." 
                        : "You don't have any notifications yet. Go interact with some posts!"}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function FilterButton({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
        active 
          ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md' 
          : 'bg-black/5 dark:bg-white/5 text-[var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`flex h-5 px-1.5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold ${
          active ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[#fd297b] text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}