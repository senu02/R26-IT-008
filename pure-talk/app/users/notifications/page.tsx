"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Info, CheckCircle2, Loader2, X } from 'lucide-react';
import Sidebar from '@/components/Home/Sidebar';
import { notificationAPI, mapNotificationType, getUserAvatar, Notification } from '@/app/services/notifications/actions';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debug: Check auth state
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    console.log('🔐 Auth Check:', {
      token: token ? 'Present' : 'Missing',
      userData: userData ? JSON.parse(userData) : 'Missing'
    });
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: 1,
        page_size: 100 // Get all for now
      };
      if (filter === 'unread') {
        params.unread_only = true;
      }
      
      console.log('📥 Fetching notifications with params:', params);
      
      // getNotifications now returns an array directly
      const results = await notificationAPI.getNotifications(params);
      
      console.log('📊 Results array:', results);
      console.log('📊 Results length:', results?.length);
      
      // Set notifications directly
      setNotifications(results || []);
      
      console.log('✅ Notifications set:', results.length, 'items');
    } catch (err: any) {
      console.error('❌ Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      console.log('📊 Unread count:', data);
      setUnreadCount(data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setUnreadCount(0);
    }
  }, []);

  // Initial load
  useEffect(() => {
    console.log('🔄 Initial load');
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Reset and refetch when filter changes
  useEffect(() => {
    console.log('🔄 Filter changed to:', filter);
    fetchNotifications();
  }, [filter, fetchNotifications]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Get icon for notification type
  const getIconForType = (type: string) => {
    const mappedType = mapNotificationType(type);
    switch (mappedType) {
      case 'like': return <Heart className="text-white" size={14} fill="currentColor" />;
      case 'comment': return <MessageCircle className="text-white" size={14} fill="currentColor" />;
      case 'mention': return <MessageCircle className="text-white" size={14} />;
      case 'follow': return <UserPlus className="text-white" size={14} />;
      case 'system': return <Info className="text-white" size={14} />;
      default: return <Bell className="text-white" size={14} />;
    }
  };

  // Get color for notification type
  const getColorForType = (type: string) => {
    const mappedType = mapNotificationType(type);
    switch (mappedType) {
      case 'like': return 'bg-rose-500';
      case 'comment': return 'bg-blue-500';
      case 'mention': return 'bg-purple-500';
      case 'follow': return 'bg-[#fd297b]';
      case 'system': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  // Get time ago
  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      if (minutes > 0) return `${minutes}m`;
      return 'Just now';
    } catch (e) {
      return 'Just now';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    if (notification.target_url) {
      router.push(notification.target_url);
    }
  };

  // Filtered notifications
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  // Get unread count for filter badge
  const getUnreadFilterCount = () => {
    if (filter === 'all') return undefined;
    return notifications.filter(n => !n.is_read).length;
  };

  console.log('🔄 Current state:', {
    notificationsCount: notifications.length,
    filteredCount: filteredNotifications.length,
    loading,
    error,
    unreadCount
  });

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
        <Sidebar />
        <main className="flex w-full flex-1 justify-center md:ml-[72px] lg:ml-[245px]">
          <div className="flex w-full max-w-[700px] flex-col px-4 md:px-8 py-8 lg:py-12">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#fd297b]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-x-hidden">
      <Sidebar />
      
      <main className="flex w-full flex-1 justify-center md:ml-[72px] lg:ml-[245px]">
        <div className="flex w-full max-w-[700px] flex-col px-4 md:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-8 border-b border-[var(--ig-border)] pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                <Bell className="text-[#fd297b]" size={32} fill="currentColor" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-bold bg-[#fd297b] text-white px-3 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-[var(--ig-muted)] text-sm md:text-base">
                {notifications.length > 0 ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}` : 'No notifications yet'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[var(--foreground)] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span className="hidden sm:inline">Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => setFilter('all')} 
              label="All Activity" 
              badge={undefined}
            />
            <FilterButton 
              active={filter === 'unread'} 
              onClick={() => setFilter('unread')} 
              label="Unread" 
              badge={getUnreadFilterCount()}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
              {error}
              <button 
                onClick={() => fetchNotifications()}
                className="ml-3 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Debug: Show notification count */}
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500">
            Debug: {notifications.length} total notifications, {filteredNotifications.length} filtered
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
                {filteredNotifications && filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={notif.id}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        notif.is_read 
                          ? 'border-[var(--ig-border)] bg-[var(--background)] opacity-70 hover:opacity-100' 
                          : 'border-[#fd297b]/30 bg-[#fd297b]/5 hover:bg-[#fd297b]/10 shadow-sm'
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Avatar & Icon Badge */}
                      <div className="relative shrink-0">
                        {notif.notification_type === 'system' || notif.notification_type === 'warning' || notif.notification_type === 'block' ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center text-white shadow-lg">
                            <Bell size={24} />
                          </div>
                        ) : (
                          <img 
                            src={getUserAvatar(notif.sender_avatar)} 
                            alt={notif.sender_name || 'User'} 
                            className="w-12 h-12 rounded-full object-cover border border-[var(--ig-border)]"
                          />
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--background)] shadow-sm ${getColorForType(notif.notification_type)}`}>
                          {getIconForType(notif.notification_type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-[15px] leading-snug pr-8 text-[var(--foreground)]">
                          {notif.sender_name && <span className="font-bold mr-1.5">{notif.sender_name}</span>}
                          <span className={notif.is_read ? 'text-[var(--ig-muted)]' : ''}>
                            {notif.content || notif.message || notif.title || 'Notification'}
                          </span>
                        </p>
                        <p className={`text-xs mt-1.5 font-medium ${notif.is_read ? 'text-[var(--ig-muted)]' : 'text-[#fd297b]'}`}>
                          {getTimeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            title="Mark as read"
                          >
                            <div className="w-3 h-3 rounded-full bg-[#fd297b] hover:bg-transparent hover:border-2 hover:border-[var(--ig-muted)] transition-all" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100"
                          title="Delete notification"
                        >
                          <X size={14} className="text-[var(--ig-muted)]" />
                        </button>
                      </div>
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

function FilterButton({ 
  active, 
  onClick, 
  label, 
  badge 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  badge?: number;
}) {
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