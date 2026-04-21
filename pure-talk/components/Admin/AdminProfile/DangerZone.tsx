// app/admin/dashboard/profile/components/DangerZone.tsx
'use client';

import React, { useState } from 'react';
import { useThemeColors } from '@/context/adminTheme';
import { useToast } from '@/context/toast';

interface DangerZoneProps {
  onDeleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DangerZone({ onDeleteAccount }: DangerZoneProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showError('Please enter your password to confirm account deletion');
      return;
    }
    
    const confirmed = window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.');
    if (!confirmed) return;
    
    setIsDeleting(true);
    const result = await onDeleteAccount(deletePassword);
    setIsDeleting(false);
    
    if (result.success) {
      showSuccess('Account deleted successfully');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      showError(`Failed to delete account: ${result.error}`);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
  };

  return (
    <div
      className="rounded-xl p-6 border-2"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.status.error + '40'
      }}
    >
      <h3 className="text-xl font-semibold mb-2" style={{ color: colors.status.error }}>
        Danger Zone
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Once you delete your account, there is no going back. Please be certain.
      </p>
      
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: colors.status.error,
            color: '#ffffff'
          }}
          disabled={isDeleting}
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.background.primary,
              borderColor: colors.border.primary,
              color: colors.text.primary
            }}
            disabled={isDeleting}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleDeleteAccount}
              className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{
                backgroundColor: colors.status.error,
                color: '#ffffff'
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Confirm Delete'
              )}
            </button>
            <button
              onClick={cancelDelete}
              className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{
                backgroundColor: 'transparent',
                borderColor: colors.border.primary,
                borderWidth: 1,
                color: colors.text.secondary
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}