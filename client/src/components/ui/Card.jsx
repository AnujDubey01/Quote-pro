import React from 'react';

export const Card = ({
  children,
  className = '',
  onClick,
  hover = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden
        ${hover ? 'hover:border-zinc-300 hover:shadow-md transition-all duration-150 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`p-5 border-b border-zinc-100 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-zinc-950 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  className = '',
}) => {
  return (
    <div className={`bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-950 font-mono">
          {value}
        </div>
        {(subtitle || badgeText) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            {badgeText && (
              <span className="font-semibold text-zinc-800">{badgeText}</span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
