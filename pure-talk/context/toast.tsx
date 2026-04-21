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
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getColors = () => {
    if (toast.type === 'error') {
      return {
        background: 'rgba(239, 68, 68, 0.12)',
        border: 'rgb(239, 68, 68)',
        icon: 'rgb(239, 68, 68)',
        text: 'rgb(239, 68, 68)',
      };
    }
    return {
      background: 'rgba(34, 197, 94, 0.12)',
      border: 'rgb(34, 197, 94)',
      icon: 'rgb(34, 197, 94)',
      text: 'rgb(34, 197, 94)',
    };
  };

  const colors = getColors();

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } mb-4`}
    >
      <div 
        className="flex items-center gap-4 px-6 py-4 rounded-xl backdrop-blur-md min-w-[380px] max-w-md relative overflow-hidden"
        style={{
          background: colors.background,
          borderLeft: `5px solid ${colors.border}`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="flex-shrink-0">
          {toast.type === 'error' ? (
            <AlertCircle size={24} style={{ color: colors.icon }} />
          ) : (
            <CheckCircle size={24} style={{ color: colors.icon }} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold" style={{ color: colors.text }}>{toast.message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="flex-shrink-0 ml-2 transition-colors hover:opacity-70"
          style={{ color: colors.text }}
        >
          <X size={18} />
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