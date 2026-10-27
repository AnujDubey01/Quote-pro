import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none tracking-tight cursor-pointer';

  const variants = {
    primary: 'bg-[#05603a] text-white hover:bg-[#044e2e] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-[#05603a] shadow-xs',
    forest: 'bg-[#05603a] text-white hover:bg-[#044e2e] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-[#05603a] shadow-xs',
    dark: 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-zinc-900 shadow-xs',
    brand: 'bg-[#05603a] text-white hover:bg-[#044e2e] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-[#05603a] shadow-xs',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 hover:shadow-xs focus:ring-zinc-400 active:scale-[0.99]',
    outline: 'border border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 hover:border-zinc-300 hover:shadow-xs focus:ring-zinc-300 shadow-2xs active:scale-[0.99]',
    ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 focus:ring-zinc-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:ring-rose-500 shadow-xs',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2 h-9 sm:h-10',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 h-11',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
