import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (options: { title?: string; message: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ title, message, type = 'info' }: { title?: string; message: string; type?: ToastType }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    info: <Info className="h-4 w-4 text-feedback-info shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-feedback-success shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-feedback-warning shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-feedback-danger shrink-0" />,
  };

  const borders: Record<ToastType, string> = {
    info: 'border-feedback-info/30',
    success: 'border-feedback-success/30',
    warning: 'border-feedback-warning/30',
    error: 'border-feedback-danger/30',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-auto flex items-start justify-between bg-app-surface border p-4 rounded-card shadow-modal transition-all animate-in slide-in-from-bottom-5 text-ink',
              borders[t.type || 'info']
            )}
          >
            <div className="flex items-start space-x-3 min-w-0">
              <span className="mt-0.5">{icons[t.type || 'info']}</span>
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-caption-text font-semibold text-ink leading-tight">{t.title}</p>}
                <p className="text-small-text text-ink-muted leading-snug">{t.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 text-ink-muted hover:text-ink hover:bg-app-surface-muted rounded-control p-1 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
