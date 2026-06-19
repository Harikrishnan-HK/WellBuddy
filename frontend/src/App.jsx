import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Today from './tabs/Today';
import Health from './tabs/Health';
import Habits from './tabs/Habits';
import Mind from './tabs/Mind';
import Insights from './tabs/Insights';

const TABS = ['Today', 'Health', 'Habits', 'Mind', 'Insights'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Today');
  const [activeSub, setActiveSub] = useState(null);

  // navigate(tab) or navigate(tab, sub) — sub resets when tab changes from navbar
  const navigate = (tab, sub = null) => {
    setActiveTab(tab);
    setActiveSub(sub);
  };

  useEffect(() => {
    const prevent = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'Today':    return <Today onNavigate={navigate} />;
      case 'Health':   return <Health initialSub={activeSub} />;
      case 'Habits':   return <Habits />;
      case 'Mind':     return <Mind initialSub={activeSub} />;
      case 'Insights': return <Insights />;
      default:         return <Today onNavigate={navigate} />;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto">
      <div className="overflow-y-auto overscroll-none pb-nav" style={{ minHeight: '100dvh' }}>
        {renderTab()}
      </div>
      <NavBar tabs={TABS} active={activeTab} onChange={(tab) => navigate(tab, null)} />
    </div>
  );
}
