import React from 'react';

const TAB_ICONS = {
  Today:     '🏠',
  Body:      '⚖️',
  Sleep:     '🌙',
  Fitness:   '🏋️',
  Mind:      '🧘',
  Nutrition: '🥗',
  Insights:  '✨',
};

export default function NavBar({ tabs, active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1e293b] border-t border-slate-700 safe-bottom z-50">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors
              ${active === tab ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <span className="text-lg leading-none">{TAB_ICONS[tab]}</span>
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}
