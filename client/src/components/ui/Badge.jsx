import React from 'react';

const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}) => {
  const variants = {
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/80',
    brand: 'bg-[#ebfaf3] text-[#05603a] border-[#bbf7d0]',
    forest: 'bg-emerald-50 text-[#05603a] border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    error: 'bg-rose-50 text-rose-700 border-rose-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    outline: 'bg-transparent text-zinc-600 border-zinc-200',
  };

  const dots = {
    neutral: 'bg-zinc-400',
    brand: 'bg-[#05603a]',
    forest: 'bg-[#05603a]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    outline: 'bg-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.neutral} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[variant] || dots.neutral}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
