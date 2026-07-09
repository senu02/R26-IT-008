import React from 'react';
import { NotificationList } from '@/components/User/Notifications/NotificationList';

export const metadata = {
  title: 'Notifications | PureTalk',
  description: 'View your notifications',
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-4 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pl-[72px] lg:pl-[245px]">
      <NotificationList />
    </div>
  );
}
