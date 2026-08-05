"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Info, CheckCircle2, Loader2, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/User/Sidebar';
import RightSidebar from '@/components/Home/RightSidebar';
import { notificationAPI, mapNotificationType, getUserAvatar, Notification } from '@/app/services/notifications/actions';
import { useRouter } from 'next/navigation';
import { getCurrentUserData, getImageUrl } from '@/lib/api';

// Import Toast
import { ToastProvider, useToast } from '@/context/userToast';

// Helper function to safely get image URL
const safeGetImageUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) return 'https://i.pravatar.cc/150?img=11';
  const url = getImageUrl(profilePicture);
  return url || 'https://i.pravatar.cc/150?img=11';
};

// Main Component Content
const NotificationsPageContent = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize toast
  const toast = useToast();

  // Load user data
  useEffect(() => {
    const userData = getCurrentUserData();
    setCurrentUser(userData);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: 1,
        page_size: 100
      };
      if (filter === 'unread') {
        params.unread_only = true;
      }
      
      const results = await notificationAPI.getNotifications(params);
      setNotifications(results || []);
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
      setUnreadCount(data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setUnreadCount(0);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Reset and refetch when filter changes
  useEffect(() => {
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
      
      toast.showInstagramToast(
        'Notification marked as read',
        'System',
        undefined,
        'like'
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.showInstagramToast(
        'Failed to mark as read',
        'System',
        undefined,
        'like'
      );
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
      
      toast.showInstagramToast(
        'All notifications marked as read',
        'System',
        undefined,
        'like'
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.showInstagramToast(
        'Failed to mark all as read',
        'System',
        undefined,
        'like'
      );
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      toast.showInstagramToast(
        'Notification deleted',
        'System',
        undefined,
        'like'
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.showInstagramToast(
        'Failed to delete notification',
        'System',
        undefined,
        'like'
      );
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

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[var(--background)] overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#fd297b]" />
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
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="text-[#fd297b]" size={20} fill="currentColor" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs font-bold bg-[#fd297b] text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
            </div>
            <button 
              onClick={() => router.push('/profile')}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--ig-border)] hover:border-[#fd297b] transition-colors"
            >
              <img 
                src={safeGetImageUrl(currentUser?.profile_picture)} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          {/* Instagram-style Search/Filter */}
          <div className="flex items-center gap-2 mb-4">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => setFilter('all')} 
              label="All" 
              badge={undefined}
            />
            <FilterButton 
              active={filter === 'unread'} 
              onClick={() => setFilter('unread')} 
              label="Unread" 
              badge={getUnreadFilterCount()}
            />
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ig-link)] hover:bg-[var(--ig-hover)] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Notifications List */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {filteredNotifications && filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={notif.id}
                      className={`flex items-center gap-3 py-3 px-2 rounded-lg transition-colors cursor-pointer ${
                        notif.is_read 
                          ? 'hover:bg-[var(--ig-hover)] opacity-70 hover:opacity-100' 
                          : 'bg-[#fd297b]/5 hover:bg-[#fd297b]/10 border-l-2 border-[#fd297b]'
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Avatar & Icon Badge */}
                      <div className="relative flex-shrink-0">
                        {notif.notification_type === 'system' || notif.notification_type === 'warning' || notif.notification_type === 'block' ? (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#fd297b] to-[#ff655b] flex items-center justify-center text-white">
                            <Bell size={20} />
                          </div>
                        ) : (
                          <img 
                            src={getUserAvatar(notif.sender_avatar)} 
                            alt={notif.sender_name || 'User'} 
                            className="w-11 h-11 rounded-full object-cover border border-[var(--ig-border)]"
                          />
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--background)] ${getColorForType(notif.notification_type)}`}>
                          {getIconForType(notif.notification_type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-[var(--foreground)]">
                          {notif.sender_name && <span className="font-semibold mr-1">{notif.sender_name}</span>}
                          <span className={notif.is_read ? 'text-[var(--ig-muted)]' : ''}>
                            {notif.content || notif.message || notif.title || 'Notification'}
                          </span>
                        </p>
                        <p className={`text-xs mt-0.5 ${notif.is_read ? 'text-[var(--ig-muted)]' : 'text-[#fd297b]'}`}>
                          {getTimeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            title="Mark as read"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-[#fd297b] hover:bg-transparent hover:border-2 hover:border-[var(--ig-muted)] transition-all" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100"
                          title="Delete notification"
                        >
                          <X size={14} className="text-[var(--ig-muted)]" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-16 h-16 bg-[var(--ig-hover)] rounded-full flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-[var(--ig-muted)]" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">
                      {filter === 'unread' ? "All caught up!" : "No notifications"}
                    </h3>
                    <p className="text-sm text-[var(--ig-muted)] max-w-sm">
                      {filter === 'unread' 
                        ? "You've read all your notifications! 🎉" 
                        : "You don't have any notifications yet."}
                    </p>
                  </div>
                )}
              </motion.div>
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

// Filter Button Component
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
      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
        active 
          ? 'bg-[var(--foreground)] text-[var(--background)]' 
          : 'bg-[var(--ig-hover)] text-[var(--foreground)] hover:bg-[var(--ig-border)]'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
          active ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[#fd297b] text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Export wrapped with ToastProvider
export default function NotificationsPage() {
  return (
    <ToastProvider>
      <NotificationsPageContent />
    </ToastProvider>
  );
}