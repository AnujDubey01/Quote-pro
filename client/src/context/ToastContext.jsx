import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastOrMessage) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    let newToast;

    if (typeof toastOrMessage === 'string') {
      newToast = {
        id,
        message: toastOrMessage,
        type: toastOrMessage.toLowerCase().includes('fail') || toastOrMessage.toLowerCase().includes('error') ? 'error' : 'success',
        duration: 4000
      };
    } else {
      newToast = {
        id,
        title: toastOrMessage.title,
        message: toastOrMessage.message || '',
        type: toastOrMessage.type || 'info', // 'success' | 'error' | 'warning' | 'info'
        duration: toastOrMessage.duration || 4000
      };
    }

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  // Expose to window for seamless integration across all services
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, [showToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white/95 text-slate-900 shadow-emerald-950/10';
      case 'error':
        return 'border-rose-200 bg-white/95 text-slate-900 shadow-rose-950/10';
      case 'warning':
        return 'border-amber-200 bg-white/95 text-slate-900 shadow-amber-950/10';
      case 'info':
      default:
        return 'border-blue-200 bg-white/95 text-slate-900 shadow-blue-950/10';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Floating Animated Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${getToastBorder(t.type)}`}
            >
              <div className="shrink-0 mt-0.5">
                {getToastIcon(t.type)}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      showToast: (msg) => {
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(msg);
        } else {
          console.log('[Toast]:', msg);
        }
      },
      removeToast: () => {}
    };
  }
  return context;
};
