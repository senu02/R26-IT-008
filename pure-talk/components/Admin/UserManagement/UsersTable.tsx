'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useThemeColors } from '@/context/adminTheme';
import { Phone, Calendar, Edit, Trash2, Lock, Unlock, CheckCircle, XCircle, AlertCircle, Shield, UserCheck, User } from 'lucide-react';
import { useToast } from '@/context/toast';
import { getImageUrl } from '@/lib/api'; // Import the helper function

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'moderator' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  createdAt: string;
  lastLogin: string;
  profile_picture?: string | null; // Added profile picture field
}

// Status Badge Component
const StatusBadge = ({ status }: { status: UserStatus }) => {
  const { colors } = useThemeColors();
  
  const config = {
    active: { icon: CheckCircle, color: colors.status.success, text: 'Active' },
    inactive: { icon: XCircle, color: colors.status.warning, text: 'Inactive' },
    suspended: { icon: AlertCircle, color: colors.status.error, text: 'Suspended' },
  };
  
  const { icon: Icon, color, text } = config[status];
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${color}20`, color: color }}>
      <Icon size={12} />
      {text}
    </span>
  );
};

// Role Badge Component
const RoleBadge = ({ role }: { role: UserRole }) => {
  const { colors } = useThemeColors();
  
  const config = {
    admin: { icon: Shield, color: colors.accent.purple, text: 'Admin' },
    moderator: { icon: UserCheck, color: colors.accent.indigo, text: 'Moderator' },
    user: { icon: User, color: colors.accent.cyan, text: 'User' },
  };
  
  const { icon: Icon, color, text } = config[role];
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${color}20`, color: color }}>
      <Icon size={12} />
      {text}
    </span>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText: string; 
  cancelText: string;
  type: 'danger' | 'warning';
}) => {
  const { colors } = useThemeColors();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const getButtonColors = () => {
    if (type === 'danger') {
      return {
        bg: colors.status.error,
        hoverBg: '#dc2626',
        text: 'white'
      };
    }
    return {
      bg: colors.status.warning,
      hoverBg: '#d97706',
      text: 'white'
    };
  };

  const buttonColors = getButtonColors();

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-200"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transition-all duration-200">
        <div 
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            background: colors.surface.primary, 
            border: `1px solid ${colors.border.primary}` 
          }}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {type === 'danger' ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.status.error}20` }}>
                  <Trash2 size={20} style={{ color: colors.status.error }} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.status.warning}20` }}>
                  <Lock size={20} style={{ color: colors.status.warning }} />
                </div>
              )}
              <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>{title}</h3>
            </div>
            <p className="mb-6" style={{ color: colors.text.secondary }}>{message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
                style={{ 
                  background: colors.surface.tertiary, 
                  color: colors.text.secondary,
                  border: `1px solid ${colors.border.primary}`
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                style={{ 
                  background: buttonColors.bg, 
                  color: buttonColors.text 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = buttonColors.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = buttonColors.bg;
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// Action Buttons Component (without dropdown)
const ActionButtons = ({ user, onEdit, onDelete, onToggleStatus }: any) => {
  const { colors } = useThemeColors();
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning';
    title: string;
    message: string;
    confirmText: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: '',
    action: async () => {},
  });
  
  const toast = useToast();

  const showConfirmation = (
    type: 'danger' | 'warning',
    title: string,
    message: string,
    confirmText: string,
    action: () => Promise<void>
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      action,
    });
  };

  const handleConfirmAction = async () => {
    await modalConfig.action();
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleDelete = () => {
    showConfirmation(
      'danger',
      'Delete User',
      `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      'Delete',
      async () => {
        await onDelete(user);
        toast.showSuccess(`🗑️ ${user.name} deleted successfully`);
      }
    );
  };

  const handleSuspend = () => {
    const isActive = user.status === 'active';
    showConfirmation(
      'warning',
      isActive ? 'Suspend User' : 'Activate User',
      isActive 
        ? `Are you sure you want to suspend "${user.name}"? They will not be able to access the system.`
        : `Are you sure you want to activate "${user.name}"? They will regain access to the system.`,
      isActive ? 'Suspend' : 'Activate',
      async () => {
        await onToggleStatus(user);
        toast.showSuccess(
          isActive 
            ? `🔒 ${user.name} suspended successfully` 
            : `🔓 ${user.name} activated successfully`
        );
      }
    );
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <button 
          onClick={() => {
            onEdit(user);
            toast.showSuccess(`✅ ${user.name} edited successfully`);
          }}
          className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
          style={{ 
            color: colors.accent.indigo,
            background: `${colors.accent.indigo}15`,
          }}
          title="Edit"
        >
          <Edit size={16} />
        </button>
        
        <button 
          onClick={handleSuspend}
          className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
          style={{ 
            color: user.status === 'active' ? colors.status.warning : colors.status.success,
            background: user.status === 'active' ? `${colors.status.warning}15` : `${colors.status.success}15`,
          }}
          title={user.status === 'active' ? 'Suspend' : 'Activate'}
        >
          {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
        
        <button 
          onClick={handleDelete}
          className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
          style={{ 
            color: colors.status.error,
            background: `${colors.status.error}15`,
          }}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText="Cancel"
        type={modalConfig.type}
      />
    </>
  );
};

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => Promise<void> | void;
  onDelete: (user: User) => Promise<void> | void;
  onToggleStatus: (user: User) => Promise<void> | void;
}

export default function UsersTable({ users, onEdit, onDelete, onToggleStatus }: UsersTableProps) {
  const { colors } = useThemeColors();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  if (users.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center"
        style={{ background: colors.surface.primary, border: `1px solid ${colors.border.primary}` }}>
        <p style={{ color: colors.text.secondary }}>No users found</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: colors.surface.primary, border: `1px solid ${colors.border.primary}` }}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border.primary}`, background: colors.surface.secondary }}>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[25%]" style={{ color: colors.text.primary }}>User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[12%]" style={{ color: colors.text.primary }}>Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[12%]" style={{ color: colors.text.primary }}>Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[15%]" style={{ color: colors.text.primary }}>Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[12%]" style={{ color: colors.text.primary }}>Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-[12%]" style={{ color: colors.text.primary }}>Last Login</th>
              <th className="px-6 py-4 text-center text-sm font-semibold w-[12%]" style={{ color: colors.text.primary }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const profileImageUrl = user.profile_picture ? getImageUrl(user.profile_picture) : null;
              const hasImageError = imageErrors[user.id] || false;
              
              return (
                <tr 
                  key={user.id}
                  onMouseEnter={() => setHoveredRow(user.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ 
                    borderBottom: index < users.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                    background: hoveredRow === user.id ? colors.surface.tertiary : 'transparent'
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Profile Image Support */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-medium flex-shrink-0 overflow-hidden"
                        style={{ 
                          background: !profileImageUrl || hasImageError ? `${colors.primary.main}20` : 'transparent',
                          color: colors.primary.main 
                        }}
                      >
                        {profileImageUrl && !hasImageError ? (
                          <img 
                            src={profileImageUrl} 
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={() => {
                              setImageErrors(prev => ({ ...prev, [user.id]: true }));
                            }}
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: colors.text.primary }}>{user.name}</p>
                        <p className="text-sm truncate" style={{ color: colors.text.secondary }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="flex-shrink-0" style={{ color: colors.text.tertiary }} />
                      <span className="truncate" style={{ color: colors.text.secondary }}>{user.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="flex-shrink-0" style={{ color: colors.text.tertiary }} />
                      <span className="truncate" style={{ color: colors.text.secondary }}>{user.createdAt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="truncate block" style={{ color: colors.text.secondary }}>
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionButtons 
                      user={user} 
                      onEdit={onEdit} 
                      onDelete={onDelete} 
                      onToggleStatus={onToggleStatus} 
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}