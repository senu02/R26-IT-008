// components/Toast/Toast.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Heart, MessageCircle, UserPlus, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'instagram' | 'info';
  duration?: number;
  username?: string;
  avatarUrl?: string;
  action?: 'like' | 'comment' | 'follow';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showInstagramToast: (message: string, username?: string, avatarUrl?: string, action?: 'like' | 'comment' | 'follow', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Instagram Action Icons
const actionIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const actionColors = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  follow: 'text-purple-500',
};

// Toast Item Component - Instagram Style
const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  // Instagram Style Toast
  if (toast.type === 'instagram') {
    const ActionIcon = toast.action ? actionIcons[toast.action] : Heart;
    const actionColor = toast.action ? actionColors[toast.action] : 'text-red-500';

    return (
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
        } mb-3 w-[380px]`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {toast.avatarUrl ? (
                  <img
                    src={toast.avatarUrl}
                    alt={toast.username || 'User'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {toast.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {toast.username || 'User'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">now</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ActionIcon className={`w-4 h-4 ${actionColor}`} />
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{toast.message}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(() => onClose(toast.id), 300);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Instagram-style bottom border animation */}
            <div className="mt-3 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Regular Toast (Success/Error/Info)
  const getColors = () => {
    if (toast.type === 'error') {
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        border: 'rgb(239, 68, 68)',
        icon: 'rgb(239, 68, 68)',
        text: 'rgb(239, 68, 68)',
        bgGradient: 'from-red-50 to-red-100',
        iconComponent: AlertCircle,
      };
    }
    if (toast.type === 'info') {
      return {
        background: 'rgba(59, 130, 246, 0.12)',
        border: 'rgb(59, 130, 246)',
        icon: 'rgb(59, 130, 246)',
        text: 'rgb(59, 130, 246)',
        bgGradient: 'from-blue-50 to-blue-100',
        iconComponent: Info,
      };
    }
    return {
      background: 'rgba(34, 197, 94, 0.12)',
      border: 'rgb(34, 197, 94)',
      icon: 'rgb(34, 197, 94)',
      text: 'rgb(34, 197, 94)',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconComponent: CheckCircle,
    };
  };

  const colors = getColors();
  const IconComponent = colors.iconComponent;

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
      } mb-3 w-[380px]`}
    >
      <div 
        className="flex items-center gap-4 px-5 py-4 rounded-xl backdrop-blur-md relative overflow-hidden shadow-lg"
        style={{
          background: colors.background,
          borderLeft: `4px solid ${colors.border}`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Background gradient accent */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.bgGradient} opacity-20`} />
        
        <div className="flex-shrink-0 relative z-10">
          <IconComponent size={22} style={{ color: colors.icon }} />
        </div>
        
        <div className="flex-1 relative z-10">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>
            {toast.message}
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="flex-shrink-0 relative z-10 transition-colors hover:opacity-70"
          style={{ color: colors.text }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showInstagramToast = useCallback((
    message: string,
    username?: string,
    avatarUrl?: string,
    action: 'like' | 'comment' | 'follow' = 'like',
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { 
      id, 
      message, 
      type: 'instagram',
      username,
      avatarUrl,
      action,
      duration 
    }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showInstagramToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
          <div className="pointer-events-auto">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('ToastProvider not found - using fallback');
    return {
      showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => {
        console.log('Toast:', message, type);
      },
      showSuccess: (message: string, duration?: number) => {
        console.log('Success:', message);
      },
      showError: (message: string, duration?: number) => {
        console.error('Error:', message);
      },
      showInfo: (message: string, duration?: number) => {
        console.log('Info:', message);
      },
      showInstagramToast: (message: string, username?: string, avatarUrl?: string, action?: 'like' | 'comment' | 'follow', duration?: number) => {
        console.log('Instagram Toast:', message, username);
      },
    };
  }
  return context;
}