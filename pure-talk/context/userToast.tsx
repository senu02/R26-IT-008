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
  comment: 'text-blue-400',
  follow: 'text-purple-400',
};

// Config for regular toast types
const regularToastConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    bar: 'from-emerald-400 via-emerald-500 to-emerald-600',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/15',
    bar: 'from-red-400 via-red-500 to-red-600',
    label: 'Error',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    bar: 'from-blue-400 via-blue-500 to-blue-600',
    label: 'Info',
  },
} as const;

// Toast Item - dark card design (fixed dark theme, matches Instagram-style mock)
const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const wrapperClass = `transform transition-all duration-300 ease-in-out ${
    isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
  } mb-3 w-[380px]`;

  // Instagram Style Toast - dark card
  if (toast.type === 'instagram') {
    const ActionIcon = toast.action ? actionIcons[toast.action] : Heart;
    const actionColor = toast.action ? actionColors[toast.action] : 'text-red-500';

    return (
      <div className={wrapperClass}>
        <div className="bg-[#1c2333] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {toast.avatarUrl ? (
                  <img
                    src={toast.avatarUrl}
                    alt={toast.username || 'User'}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {toast.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-white text-sm">
                    {toast.username || 'User'}
                  </span>
                  <span className="text-gray-500 text-sm">•</span>
                  <span className="text-gray-400 text-xs">now</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ActionIcon className={`w-4 h-4 ${actionColor}`} fill="currentColor" />
                  <p className="text-sm text-gray-300 truncate">{toast.message}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bottom gradient bar */}
            <div className="mt-3 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Regular Toast (Success/Error/Info) - same dark card design
  const config = regularToastConfig[toast.type as 'success' | 'error' | 'info'] || regularToastConfig.success;
  const IconComponent = config.icon;

  return (
    <div className={wrapperClass}>
      <div className="bg-[#1c2333] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon circle (replaces avatar) */}
            <div className="flex-shrink-0">
              <div className={`w-11 h-11 rounded-full ${config.iconBg} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white text-sm">
                  {config.label}
                </span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-400 text-xs">now</span>
              </div>
              <p className="text-sm text-gray-300 mt-0.5">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors mt-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Bottom gradient bar, colored to match toast type */}
          <div className={`mt-3 h-0.5 bg-gradient-to-r ${config.bar} rounded-full animate-pulse`} />
        </div>
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