"use client";
import React, { useState, useEffect } from 'react';
import { getCurrentUserData, getImageUrl, userAPI, User } from '@/lib/api';

const RightSidebar = () => {
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');
  const [userName, setUserName] = useState('azevedo_drdr');
  const [fullName, setFullName] = useState('Azevedo');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUserData();
    if (currentUser) {
      setUserAvatar(getImageUrl(currentUser.profile_picture) || 'https://i.pravatar.cc/150?img=11');
      setUserName(currentUser.full_name?.toLowerCase().replace(/\s/g, '_') || currentUser.email?.split('@')[0] || 'user');
      setFullName(currentUser.full_name || 'User');
    }

    const fetchUsers = async () => {
      try {
        const fetchedUsers = await userAPI.getAllUsers();
        // Exclude current user from suggestions
        const filteredUsers = fetchedUsers.filter(u => u.id !== currentUser?.id).slice(0, 5);
        setSuggestedUsers(filteredUsers);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex w-full max-w-[320px] flex-col text-sm text-[var(--foreground)]">
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

      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-[var(--ig-muted)]">Suggestions for you</span>
        <button type="button" className="text-xs font-semibold text-[var(--foreground)] hover:opacity-70">
          See all
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {suggestedUsers.map((suggestion, index) => {
          const avatarUrl = getImageUrl(suggestion.profile_picture) || `https://i.pravatar.cc/150?img=${(index % 70) + 1}`;
          const suggestionName = suggestion.full_name?.toLowerCase().replace(/\s/g, '_') || suggestion.email.split('@')[0];
          
          return (
            <div key={suggestion.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 cursor-pointer items-center gap-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <img src={avatarUrl} alt={suggestionName} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="truncate text-sm font-semibold hover:opacity-70">{suggestionName}</span>
                  <span className="w-full max-w-[180px] truncate text-xs text-[var(--ig-muted)]">Suggested for you</span>
                </div>
              </div>
              <button type="button" className="shrink-0 text-xs font-semibold text-[var(--ig-link)] hover:opacity-80">
                Follow
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 text-xs font-normal text-[var(--ig-muted)]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">
            About
          </a>
          <a href="#" className="hover:underline">
            Help
          </a>
          <a href="#" className="hover:underline">
            Press
          </a>
          <a href="#" className="hover:underline">
            API
          </a>
          <a href="#" className="hover:underline">
            Jobs
          </a>
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <a href="#" className="hover:underline">
            Locations
          </a>
          <a href="#" className="hover:underline">
            Language
          </a>
        </div>
        <span className="uppercase tracking-wide">© {new Date().getFullYear()} PureTalk</span>
      </div>
    </div>
  );
};

export default RightSidebar;
