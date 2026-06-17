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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1e293b]/95 backdrop-blur border-t border-slate-700/60 z-50"
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 text-[10px] font-medium transition-colors active:opacity-60
              ${active === tab ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <span className={`text-[22px] leading-none transition-transform duration-150 ${active === tab ? 'scale-110' : 'scale-100'}`}>
              {TAB_ICONS[tab]}
            </span>
            <span className={active === tab ? 'text-indigo-400' : ''}>{tab}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
