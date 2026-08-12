'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Item Component
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

  const isError = toast.type === 'error';
  const badgeLabel = isError ? 'ALERT' : 'SUCCESS';
  const glowColor = isError ? 'from-rose-600/20 to-red-950/10' : 'from-emerald-600/20 to-teal-900/10';
  const borderColor = isError ? 'border-rose-500/30' : 'border-emerald-500/30';
  const iconBg = isError ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  const badgeBg = isError ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  const barColor = isError ? 'from-rose-500 via-red-500 to-rose-700' : 'from-emerald-400 via-teal-400 to-emerald-600';

  return (
    <div
      className={`transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
        isExiting ? 'translate-x-full opacity-0 scale-90' : 'translate-x-0 opacity-100 scale-100'
      } mb-3.5 w-[390px]`}
    >
      <div className={`relative rounded-2xl p-[1px] bg-gradient-to-r ${glowColor} shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all hover:scale-[1.02]`}>
        <div className={`relative overflow-hidden rounded-2xl bg-[#0a0f1d]/90 p-4 border ${borderColor} sidebar-card-pattern`}>
          {/* Ambient Spotlight */}
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-3.5">
            {/* Icon circle */}
            <div className="flex-shrink-0">
              <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>
                {isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-md border ${badgeBg}`}>
                  {badgeLabel}
                </span>
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
              className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
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

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
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
      showToast: (message: string, type?: 'success' | 'error', duration?: number) => {
        console.log('Toast:', message, type);
      },
      showSuccess: (message: string, duration?: number) => {
        console.log('Success:', message);
      },
      showError: (message: string, duration?: number) => {
        console.error('Error:', message);
      },
    };
  }
  return context;
}