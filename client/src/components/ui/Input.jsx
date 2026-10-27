import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  helperText,
  error,
  leftIcon: LeftIcon,
  rightSlot,
  type = 'text',
  className = '',
  containerClassName = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-zinc-700 tracking-tight select-none"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        </div>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-zinc-400 flex items-center justify-center">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`
            w-full rounded-lg text-sm bg-white text-zinc-900 border transition-all duration-150
            placeholder:text-zinc-400 outline-none
            ${LeftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightSlot ? 'pr-11' : 'pr-3.5'}
            py-2.5 h-10
            ${error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              : 'border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
            }
            disabled:bg-zinc-50 disabled:text-zinc-500 disabled:border-zinc-200 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {rightSlot && (
          <div className="absolute right-2.5 flex items-center justify-center">
            {rightSlot}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      )}

      {!error && helperText && (
        <p className="mt-1.5 text-xs text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
