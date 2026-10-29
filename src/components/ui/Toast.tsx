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
    info: <Info className="h-4 w-4 text-black shrink-0" />,
    success: <CheckCircle2 className="h-4 w-4 text-black shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-black shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-black shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start justify-between bg-white border border-black p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5',
              'text-black'
            )}
          >
            <div className="flex items-start space-x-3">
              <span className="mt-0.5">{icons[t.type || 'info']}</span>
              <div>
                {t.title && <p className="text-xs font-bold uppercase tracking-wider">{t.title}</p>}
                <p className="text-xs text-neutral-700">{t.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-4 text-neutral-500 hover:text-black p-0.5"
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
