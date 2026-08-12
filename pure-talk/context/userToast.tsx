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
    iconBg: 'bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    glowColor: 'from-emerald-600/20 to-teal-900/10',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
    bar: 'from-emerald-400 via-teal-400 to-emerald-600',
    label: 'SUCCESS',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/20 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    glowColor: 'from-rose-600/20 to-red-950/10',
    borderColor: 'border-rose-500/30 hover:border-rose-500/50',
    bar: 'from-rose-500 via-red-500 to-rose-700',
    label: 'ALERT',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  info: {
    icon: Info,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/20 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    glowColor: 'from-sky-600/20 to-indigo-950/10',
    borderColor: 'border-sky-500/30 hover:border-sky-500/50',
    bar: 'from-sky-400 via-blue-500 to-indigo-600',
    label: 'NOTICE',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
} as const;

// Toast Item - Ultra modern glassmorphism toast component
const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const wrapperClass = `transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
    isExiting ? 'translate-x-full opacity-0 scale-90' : 'translate-x-0 opacity-100 scale-100'
  } mb-3.5 w-[390px]`;

  // Instagram Style Social Toast - ultra modern dark glass card
  if (toast.type === 'instagram') {
    const ActionIcon = toast.action ? actionIcons[toast.action] : Heart;
    const actionColor = toast.action ? actionColors[toast.action] : 'text-rose-400';

    return (
      <div className={wrapperClass}>
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-rose-500/40 via-purple-500/30 to-amber-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all hover:scale-[1.02]">
          <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d]/90 p-4 border border-white/10 sidebar-card-pattern">
            {/* Ambient Background Spotlights */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-start gap-3.5">
              {/* Avatar with IG gradient ring */}
              <div className="relative flex-shrink-0">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                  {toast.avatarUrl ? (
                    <img
                      src={toast.avatarUrl}
                      alt={toast.username || 'User'}
                      className="w-11 h-11 rounded-full object-cover border border-[#0a0f1d]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-600 to-purple-700 flex items-center justify-center text-white font-extrabold text-base border border-[#0a0f1d]">
                      {toast.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0a0f1d] border border-white/20 shadow-md">
                  <ActionIcon className={`w-3.5 h-3.5 ${actionColor}`} fill="currentColor" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-white text-sm tracking-wide truncate">
                      {toast.username || 'PureTalk'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {toast.action || 'social'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">just now</span>
                </div>
                <p className="text-xs font-medium text-slate-200 leading-relaxed truncate">{toast.message}</p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="mt-3.5 h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 rounded-full"
                style={{
                  animation: `toastProgress ${toast.duration || 3500}ms linear forwards`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular Toast (Success/Error/Info) - ultra modern glass card
  const config = regularToastConfig[toast.type as 'success' | 'error' | 'info'] || regularToastConfig.success;
  const IconComponent = config.icon;

  return (
    <div className={wrapperClass}>
      <div className={`relative rounded-2xl p-[1px] bg-gradient-to-r ${config.glowColor} shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all hover:scale-[1.02]`}>
        <div className={`relative overflow-hidden rounded-2xl bg-[#0a0f1d]/90 p-4 border ${config.borderColor} sidebar-card-pattern`}>
          {/* Ambient Spotlight */}
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-3.5">
            {/* Icon circle */}
            <div className="flex-shrink-0">
              <div className={`w-11 h-11 rounded-full ${config.iconBg} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-md border ${config.badgeBg}`}>
                    {config.label}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">just now</span>
              </div>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">{toast.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Countdown Progress Bar */}
          <div className="mt-3.5 h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.bar} rounded-full`}
              style={{
                animation: `toastProgress ${toast.duration || 3500}ms linear forwards`
              }}
            />
          </div>
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