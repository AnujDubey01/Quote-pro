import React from 'react';

const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200/60 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none
              ${isActive
                ? 'bg-white text-zinc-950 font-semibold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }
            `}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
