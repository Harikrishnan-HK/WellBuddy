import React, { useState } from 'react';
import NavBar from './components/NavBar';
import Today from './tabs/Today';
import Body from './tabs/Body';
import Sleep from './tabs/Sleep';
import Fitness from './tabs/Fitness';
import Mind from './tabs/Mind';
import Nutrition from './tabs/Nutrition';
import Insights from './tabs/Insights';

const TABS = ['Today', 'Body', 'Sleep', 'Fitness', 'Mind', 'Nutrition', 'Insights'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Today');

  const renderTab = () => {
    switch (activeTab) {
      case 'Today': return <Today />;
      case 'Body': return <Body />;
      case 'Sleep': return <Sleep />;
      case 'Fitness': return <Fitness />;
      case 'Mind': return <Mind />;
      case 'Nutrition': return <Nutrition />;
      case 'Insights': return <Insights />;
      default: return <Today />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[430px] mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {renderTab()}
      </main>
      <NavBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
