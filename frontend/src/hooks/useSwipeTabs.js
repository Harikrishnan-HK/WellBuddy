import { useRef } from 'react';

export default function useSwipeTabs(tabs, current, onChange) {
  const startX = useRef(null);

  return {
    onTouchStart: (e) => { startX.current = e.touches[0].clientX; },
    onTouchEnd: (e) => {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      startX.current = null;
      if (Math.abs(dx) < 50) return;
      const idx = tabs.indexOf(current);
      if (dx < 0 && idx < tabs.length - 1) onChange(tabs[idx + 1]);
      if (dx > 0 && idx > 0) onChange(tabs[idx - 1]);
    },
  };
}
