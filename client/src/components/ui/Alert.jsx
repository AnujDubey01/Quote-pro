import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const configs = {
    error: {
      bg: 'bg-rose-50/70 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50/70 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    success: {
      bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    info: {
      bg: 'bg-blue-50/70 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const current = configs[variant] || configs.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all duration-150 ${current.bg} ${className}`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 text-xs sm:text-sm">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 transition p-0.5 rounded"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
