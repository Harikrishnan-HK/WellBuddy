import React from 'react';
import Icon from './Icon';

const TAB_ICONS = {
  Today:    'home',
  Health:   'activity',
  Habits:   'target',
  Mind:     'wind',
  Insights: 'sparkles',
};

export default function NavBar({ tabs, active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{
        background: 'rgba(45,56,62,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(150,154,158,0.15)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = active === tab;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className="flex-1 flex flex-col items-center pt-2 pb-1 gap-0.5 transition-opacity active:opacity-50"
              style={{ color: isActive ? '#F95C4B' : '#6B6862' }}
            >
              <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <Icon name={TAB_ICONS[tab]} size={22} />
              </span>
              <span className="text-[10px] font-medium">{tab}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
