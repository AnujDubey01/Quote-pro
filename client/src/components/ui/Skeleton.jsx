import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  ...props
}) => {
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-3.5 w-full',
  };

  return (
    <div
      className={`animate-pulse bg-zinc-200/70 ${variants[variant] || variants.rectangular} ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-7 w-36" />
    <Skeleton className="h-3.5 w-24" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
    <div className="p-4 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-60 ml-auto rounded-lg" />
    </div>
    <div className="divide-y divide-zinc-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${cIdx === 0 ? 'w-36' : cIdx === 1 ? 'w-48' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
