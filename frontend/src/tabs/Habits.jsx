import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import Icon from '../components/Icon';

const PALETTE = [
  '#AA7452', '#7C5841', '#C4956A', '#8B6248',
  '#D4B896', '#B8A99A', '#4A8C7A', '#2D7A6B',
  '#6B8C7A', '#8C6B4A', '#5C7A8C', '#7A5C8C',
];

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const BG      = '#051822';
const CARD    = '#2D383E';
const DEEP    = '#1C2C35';
const ACCENT  = '#AA7452';
const ACCENT2 = '#7C5841';
const TEXT    = '#D4C9C7';
const MUTED   = '#969A9E';
const DIM     = '#6B7680';
const BORDER  = '#3A4C55';

function todayStr() { return new Date().toISOString().slice(0, 10); }

/** Returns the 7 dates of the week containing today, offset by `weekOffset` weeks. */
function weekDates(weekOffset = 0) {
  const today = new Date();
  const dow = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i + weekOffset * 7);
    return d;
  });
}

function dateKey(d) { return d.toISOString().slice(0, 10); }

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function Habits() {
  const [view, setView]           = useState('today');
  const [habits, setHabits]       = useState([]);
  const [logs, setLogs]           = useState({});
  const [stats, setStats]         = useState([]);
  const [rangeLogs, setRange]     = useState([]);   // current week logs (for week strip)
  const [monthLogs, setMonthLogs] = useState([]);   // current month logs (for calendar)
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [weekOffset, setWeekOffset]     = useState(0);
  const [showAdd, setShowAdd]     = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [loading, setLoading]     = useState(true);

  const week = weekDates(weekOffset);

  const load = useCallback(async (date = selectedDate, wOffset = weekOffset) => {
    setLoading(true);
    try {
      const [h, l, s] = await Promise.all([
        api.getHabits(),
        api.getHabitLogs(date),
        api.getHabitStats(),
      ]);
      setHabits(h);
      const logMap = {};
      l.forEach(entry => { logMap[entry.habit_id] = entry; });
      setLogs(logMap);
      setStats(s);

      // Week range for strip dots
      const wDates = weekDates(wOffset);
      const r = await api.getHabitLogsRange(dateKey(wDates[0]), dateKey(wDates[6]));
      setRange(r);

      // Month range for calendar
      const now = new Date();
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const mLogs  = await api.getHabitLogsRange(dateKey(mStart), dateKey(mEnd));
      setMonthLogs(mLogs);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, weekOffset]);

  useEffect(() => { load(selectedDate, weekOffset); }, [selectedDate, weekOffset]);

  // When week offset changes, fetch range for new week
  const handleWeekChange = (delta) => {
    const newOffset = weekOffset + delta;
    setWeekOffset(newOffset);
    // If going to a week with no selected date visible, reset to that week's today equivalent
    const newWeek = weekDates(newOffset);
    const newWeekKeys = newWeek.map(dateKey);
    if (!newWeekKeys.includes(selectedDate)) {
      // select same day-of-week in new week
      const todayDow = new Date(selectedDate).getDay();
      setSelectedDate(dateKey(newWeek[todayDow]));
    }
  };

  const toggleHabit = async (habit) => {
    await api.logHabit({ habit_id: habit.id, date: selectedDate });
    load(selectedDate, weekOffset);
  };

  const incrementHabit = async (habit) => {
    const existing = logs[habit.id];
    const cur = existing ? existing.value : 0;
    const next = cur >= habit.goal_value ? 0 : cur + 1;
    if (next === 0) await api.logHabit({ habit_id: habit.id, date: selectedDate });
    else await api.logHabit({ habit_id: habit.id, date: selectedDate, value: next });
    load(selectedDate, weekOffset);
  };

  const deleteHabit = async (id) => {
    await api.deleteHabit(id);
    load(selectedDate, weekOffset);
  };

  const reorderHabits = async (newOrder) => {
    await api.reorderHabits(newOrder.map((h, i) => ({ id: h.id, sort_order: i })));
    setHabits(newOrder);
  };

  const rangeMap = {};
  rangeLogs.forEach(l => {
    if (!rangeMap[l.date]) rangeMap[l.date] = new Set();
    rangeMap[l.date].add(l.habit_id);
  });

  return (
    <div className="pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Habits</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setView(v => v === 'today' ? 'stats' : 'today')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            style={{ background: CARD, color: MUTED }}>
            <Icon name={view === 'today' ? 'bar-chart' : 'list'} size={13} />
            {view === 'today' ? 'Stats' : 'Today'}
          </button>
          <button
            onClick={() => { setEditHabit(null); setShowAdd(true); }}
            className="w-8 h-8 rounded-xl font-bold text-lg flex items-center justify-center"
            style={{ background: ACCENT, color: BG }}>
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <WeekStrip
        week={week}
        weekOffset={weekOffset}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onWeekChange={handleWeekChange}
        rangeMap={rangeMap}
        totalHabits={habits.length}
      />

      {view === 'today' ? (
        <TodayView
          habits={habits}
          logs={logs}
          loading={loading}
          selectedDate={selectedDate}
          onToggle={toggleHabit}
          onIncrement={incrementHabit}
          onEdit={(h) => { setEditHabit(h); setShowAdd(true); }}
          onDelete={deleteHabit}
          onReorder={reorderHabits}
        />
      ) : (
        <StatsView habits={habits} stats={stats} rangeLogs={rangeLogs} monthLogs={monthLogs} />
      )}

      {showAdd && (
        <HabitForm
          initial={editHabit}
          onSave={async (data) => {
            if (editHabit) await api.updateHabit(editHabit.id, data);
            else await api.createHabit(data);
            setShowAdd(false);
            setEditHabit(null);
            load(selectedDate, weekOffset);
          }}
          onClose={() => { setShowAdd(false); setEditHabit(null); }}
        />
      )}
    </div>
  );
}

// ─── Week Strip ───────────────────────────────────────────────────────────────
function WeekStrip({ week, weekOffset, selected, onSelect, onWeekChange, rangeMap, totalHabits }) {
  const isCurrentWeek = weekOffset === 0;
  const monthLabel = week[3].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="px-2 mb-4">
      {/* Week navigation row */}
      <div className="flex items-center justify-between px-1 mb-2">
        <button
          onClick={() => onWeekChange(-1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg active:opacity-60"
          style={{ color: MUTED }}>
          <Icon name="chevron-right" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium" style={{ color: MUTED }}>{monthLabel}</p>
          {!isCurrentWeek && (
            <button
              onClick={() => onWeekChange(-weekOffset)}
              className="text-[10px] px-2 py-0.5 rounded-lg"
              style={{ color: ACCENT, background: 'rgba(170,116,82,0.15)' }}>
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => onWeekChange(1)}
          disabled={isCurrentWeek}
          className="w-7 h-7 flex items-center justify-center rounded-lg active:opacity-60 disabled:opacity-30"
          style={{ color: MUTED }}>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Day cells */}
      <div className="flex justify-between">
        {week.map((d) => {
          const ds = dateKey(d);
          const isToday    = ds === todayStr();
          const isSelected = ds === selected;
          const isFuture   = ds > todayStr();
          const count = rangeMap[ds]?.size || 0;
          const pct   = totalHabits > 0 ? count / totalHabits : 0;

          return (
            <button key={ds} onClick={() => onSelect(ds)} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px]" style={{ color: DIM }}>{DAY_LABELS[d.getDay()]}</span>
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isSelected ? ACCENT : CARD,
                  outline: isToday && !isSelected ? `2px solid ${ACCENT}` : 'none',
                  outlineOffset: 2,
                }}>
                {!isFuture && pct > 0 && totalHabits > 0 && (
                  <svg className="absolute inset-0 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke={`${ACCENT}33`} strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke={ACCENT} strokeWidth="2.5"
                      strokeDasharray={`${pct * 94.2} 94.2`} strokeLinecap="round" />
                  </svg>
                )}
                <span className="text-sm font-semibold z-10"
                  style={{ color: isSelected ? BG : isToday ? ACCENT : TEXT }}>
                  {d.getDate()}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full"
                style={{ background: !isFuture && count > 0 && count >= totalHabits ? ACCENT : 'transparent' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Today View ───────────────────────────────────────────────────────────────
function TodayView({ habits, logs, loading, onToggle, onIncrement, onEdit, onDelete, onReorder }) {
  const [items, setItems]   = useState(habits);
  const [dragId, setDragId] = useState(null);
  const cardHeight = 56;
  const longPressTimer = useRef(null);
  const dragStartY = useRef(null);

  useEffect(() => { setItems(habits); }, [habits]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
    </div>
  );

  if (habits.length === 0) return (
    <div className="mx-4 mt-8 rounded-2xl p-5 border border-dashed text-center space-y-1"
      style={{ background: CARD, borderColor: BORDER }}>
      <p className="font-semibold" style={{ color: TEXT }}>No habits yet</p>
      <p className="text-sm" style={{ color: DIM }}>Tap + to add your first habit</p>
    </div>
  );

  const completed = items.filter(h => logs[h.id]).length;

  const onLongPressStart = (habit, index, e) => {
    const y = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setDragId(habit.id);
      dragStartY.current = y;
    }, 500);
  };

  const onLongPressMove = (e) => {
    if (!dragId) { clearTimeout(longPressTimer.current); return; }
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = y - dragStartY.current;
    const delta = Math.round(dy / cardHeight);
    const fromIdx = items.findIndex(h => h.id === dragId);
    const toIdx = Math.max(0, Math.min(items.length - 1, fromIdx + delta));
    if (toIdx !== fromIdx) {
      const next = [...items];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setItems(next);
      dragStartY.current = y;
    }
  };

  const onLongPressEnd = () => {
    clearTimeout(longPressTimer.current);
    if (dragId) {
      onReorder(items);
      setDragId(null);
      dragStartY.current = null;
    }
  };

  return (
    <div className="px-4 space-y-2"
      onTouchMove={onLongPressMove}
      onTouchEnd={onLongPressEnd}
      onTouchCancel={onLongPressEnd}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: DEEP }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%`,
              background: `linear-gradient(to right, ${ACCENT2}, ${ACCENT})`,
            }} />
        </div>
        <span className="text-xs" style={{ color: DIM }}>{completed}/{items.length}</span>
      </div>

      {dragId && (
        <p className="text-[10px] text-center -mt-1 mb-1" style={{ color: ACCENT }}>
          Hold & drag to reorder · release to save
        </p>
      )}

      {items.map((habit, index) => (
        <div key={habit.id}
          onTouchStart={(e) => onLongPressStart(habit, index, e)}
          style={{
            opacity: dragId === habit.id ? 0.6 : 1,
            transform: dragId === habit.id ? 'scale(0.97)' : 'scale(1)',
            transition: 'transform 0.15s, opacity 0.15s',
            boxShadow: dragId === habit.id ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
          }}>
          <SwipeableHabitCard
            habit={habit} log={logs[habit.id]} isDragging={dragId === habit.id}
            onToggle={onToggle} onIncrement={onIncrement} onEdit={onEdit} onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Swipeable Habit Card ─────────────────────────────────────────────────────
function SwipeableHabitCard({ habit, log, isDragging, onToggle, onIncrement, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef(null);
  const startOffset = useRef(0);
  const REVEAL = 112;

  const open  = () => { setAnimating(true); setOffset(-REVEAL); };
  const close = () => { setAnimating(true); setOffset(0); };

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; startOffset.current = offset; setAnimating(false); };
  const handleTouchMove  = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    setOffset(Math.min(0, Math.max(-REVEAL, startOffset.current + dx)));
  };
  const handleTouchEnd = () => {
    startX.current = null;
    setAnimating(true);
    if (offset < -REVEAL / 2) open(); else close();
  };

  const isBoolean = habit.goal_type === 'boolean';
  const cur  = log?.value || 0;
  const done = isBoolean ? !!log : cur >= habit.goal_value;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: CARD }}>
      <div style={{
        display: 'flex',
        width: `calc(100% + ${REVEAL}px)`,
        transform: `translateX(${offset}px)`,
        transition: animating ? 'transform 0.22s ease' : 'none',
      }}>
        {/* Card face */}
        <div
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          onClick={() => offset < 0 && close()}
          style={{
            flex: `0 0 calc(100% - ${REVEAL}px)`,
            background: done ? `${habit.color}18` : CARD,
            borderLeft: done ? `3px solid ${habit.color}` : '3px solid transparent',
          }}
          className="flex items-center gap-3 px-3 py-2.5">
          {isDragging && (
            <div className="flex flex-col gap-0.5 shrink-0 pr-1">
              {[0,1,2].map(i => <div key={i} className="w-3.5 h-0.5 rounded-full" style={{ background: MUTED }} />)}
            </div>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: `${habit.color}30` }}>
            {habit.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: done ? DIM : TEXT }}>{habit.name}</p>
            {!isBoolean && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ maxWidth: 60, background: DEEP }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min((cur / habit.goal_value) * 100, 100)}%`, background: habit.color }} />
                </div>
                <span className="text-[10px]" style={{ color: DIM }}>{cur}/{habit.goal_value}</span>
              </div>
            )}
          </div>
          {isBoolean ? (
            <button onClick={() => onToggle(habit)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={done ? { background: habit.color, borderColor: habit.color } : { borderColor: BORDER }}>
              {done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              )}
            </button>
          ) : (
            <button onClick={() => onIncrement(habit)}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all"
              style={done ? { background: habit.color, borderColor: habit.color, color: '#fff' } : { borderColor: habit.color, color: habit.color }}>
              {done ? '✓' : cur > 0 ? cur : '+'}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ flex: `0 0 ${REVEAL}px`, display: 'flex' }}>
          <button onClick={() => { close(); onEdit(habit); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium"
            style={{ background: ACCENT2, color: '#fff' }}>
            <Icon name="edit" size={15} />
            Edit
          </button>
          <button onClick={() => { close(); onDelete(habit.id); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium"
            style={{ background: '#8C3030', color: '#fff' }}>
            <Icon name="trash" size={15} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats View ───────────────────────────────────────────────────────────────
function StatsView({ habits, stats, rangeLogs, monthLogs }) {
  const statMap = {};
  stats.forEach(s => { statMap[s.habit_id] = s; });

  const bestStreak = stats.reduce((m, s) => Math.max(m, s.best_streak), 0);
  const perfectDays30 = (() => {
    const byDate = {};
    rangeLogs.forEach(l => { byDate[l.date] = (byDate[l.date] || 0) + 1; });
    return Object.values(byDate).filter(c => c >= habits.length && habits.length > 0).length;
  })();
  const overallRate = stats.length > 0
    ? Math.round(stats.reduce((s, h) => s + h.rate_30, 0) / stats.length) : 0;

  return (
    <div className="px-4 space-y-4">
      {/* Overall ring */}
      <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: CARD }}>
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke={DEEP} strokeWidth="8" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={ACCENT} strokeWidth="8"
              strokeDasharray={`${(overallRate / 100) * 201} 201`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-bold" style={{ color: TEXT }}>{overallRate}%</p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>30-day overall</p>
          <div className="flex gap-4">
            <div>
              <p className="text-xl font-bold" style={{ color: ACCENT }}>{bestStreak}</p>
              <p className="text-[10px]" style={{ color: DIM }}>Best streak</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: '#7CA87A' }}>{perfectDays30}</p>
              <p className="text-[10px]" style={{ color: DIM }}>Perfect days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly calendar */}
      <MonthCalendar habits={habits} monthLogs={monthLogs} />

      {/* Per-habit stats */}
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Per habit</p>
      {habits.map(habit => {
        const s = statMap[habit.id] || {};
        return (
          <div key={habit.id} className="rounded-2xl p-4" style={{ background: CARD }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${habit.color}33` }}>{habit.emoji}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: TEXT }}>{habit.name}</p>
                <p className="text-xs" style={{ color: DIM }}>{s.completed_30 || 0} / 30 days</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: habit.color }}>{s.rate_30 || 0}%</p>
                <p className="text-[10px]" style={{ color: DIM }}>30d rate</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: DEEP }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.rate_30 || 0}%`, background: habit.color }} />
            </div>
            <div className="flex gap-4 mt-3">
              <div>
                <span className="text-sm font-bold" style={{ color: ACCENT }}>{s.streak || 0}</span>
                <span className="text-xs ml-1" style={{ color: DIM }}>current streak</span>
              </div>
              <div>
                <span className="text-sm font-bold" style={{ color: ACCENT2 }}>{s.best_streak || 0}</span>
                <span className="text-xs ml-1" style={{ color: DIM }}>best streak</span>
              </div>
            </div>
          </div>
        );
      })}
      {habits.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: DIM }}>No habits to show stats for.</div>
      )}
    </div>
  );
}

// ─── Monthly Calendar ─────────────────────────────────────────────────────────
function MonthCalendar({ habits, monthLogs }) {
  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build map: date-string → count of distinct habits logged
  const logMap = {};
  monthLogs.forEach(l => {
    if (!logMap[l.date]) logMap[l.date] = new Set();
    logMap[l.date].add(l.habit_id);
  });

  const today = todayStr();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const total = habits.length;

  // Build cells: nulls for empty prefix, then 1…daysInMonth
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-2xl p-4" style={{ background: CARD }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>{monthLabel}</p>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <p key={d} className="text-[10px] text-center font-medium" style={{ color: DIM }}>{d}</p>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const ds = `${monthStr}-${String(day).padStart(2, '0')}`;
          const count   = logMap[ds]?.size || 0;
          const pct     = total > 0 ? count / total : 0;
          const isToday  = ds === today;
          const isFuture = ds > today;

          // Compute fill opacity based on completion
          const fillAlpha = isFuture ? 0 : pct === 0 ? 0 : Math.max(0.25, pct);
          const fillColor = pct > 0 && !isFuture
            ? `rgba(170, 116, 82, ${fillAlpha})`
            : 'transparent';

          return (
            <div key={ds} className="flex flex-col items-center py-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center relative"
                style={{
                  background: fillColor,
                  outline: isToday ? `1.5px solid ${ACCENT}` : 'none',
                  outlineOffset: 1,
                }}>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isToday ? ACCENT : pct >= 1 ? TEXT : MUTED }}>
                  {day}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px]" style={{ color: DIM }}>Less</span>
        {[0.25, 0.5, 0.75, 1].map(a => (
          <div key={a} className="w-3.5 h-3.5 rounded-sm"
            style={{ background: `rgba(170,116,82,${a})` }} />
        ))}
        <span className="text-[10px]" style={{ color: DIM }}>More</span>
      </div>
    </div>
  );
}

// ─── Add / Edit Habit Form ────────────────────────────────────────────────────
function HabitForm({ initial, onSave, onClose }) {
  const [name, setName]         = useState(initial?.name || '');
  const [emoji, setEmoji]       = useState(initial?.emoji || '⭐');
  const [color, setColor]       = useState(initial?.color || PALETTE[0]);
  const [goalType, setGoalType] = useState(initial?.goal_type || 'boolean');
  const [goalValue, setGoalValue] = useState(initial?.goal_value || 1);
  const [saving, setSaving]     = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const EMOJI_SET = ['⭐','✅','💪','🏃','🧘','📚','💧','🥗','😴','🎯','🔥','❤️','🧠','🌿','☕','🎵','📝','🚫','🌅','🛏️'];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), emoji, color, goal_type: goalType, goal_value: parseInt(goalValue) || 1 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative rounded-t-3xl flex flex-col" style={{ background: BG, maxHeight: '88vh' }}>
        <div className="overflow-y-auto p-5 space-y-5"
          style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 8px) + 72px)' }}>

          <div className="w-10 h-1 rounded-full mx-auto -mt-1 mb-2" style={{ background: BORDER }} />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: TEXT }}>{initial ? 'Edit Habit' : 'New Habit'}</h2>
            <button onClick={onClose} className="text-sm" style={{ color: DIM }}>Cancel</button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowEmoji(e => !e)}
              className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center shrink-0"
              style={{ background: `${color}33` }}>
              {emoji}
            </button>
            <input type="text" placeholder="Habit name" value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 rounded-2xl px-4 outline-none text-base"
              style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}` }} />
          </div>

          {showEmoji && (
            <div className="flex flex-wrap gap-2">
              {EMOJI_SET.map(e => (
                <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
                  style={{ background: emoji === e ? ACCENT : CARD }}>
                  {e}
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Color</p>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{ background: c, transform: color === c ? 'scale(1.25)' : 'scale(1)',
                    outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Goal type</p>
            <div className="flex gap-2">
              {['boolean','count'].map(t => (
                <button key={t} onClick={() => setGoalType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={goalType === t ? { background: ACCENT, color: BG } : { background: CARD, color: MUTED }}>
                  {t === 'boolean' ? 'Yes / No' : 'Count'}
                </button>
              ))}
            </div>
            {goalType === 'count' && (
              <div className="mt-2 flex items-center gap-3">
                <p className="text-xs" style={{ color: MUTED }}>Goal count:</p>
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: CARD }}>
                  <button onClick={() => setGoalValue(v => Math.max(1, v - 1))}
                    className="text-lg w-6" style={{ color: MUTED }}>−</button>
                  <span className="font-bold w-6 text-center" style={{ color: TEXT }}>{goalValue}</span>
                  <button onClick={() => setGoalValue(v => v + 1)}
                    className="text-lg w-6" style={{ color: MUTED }}>+</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 active:opacity-80"
            style={{ background: ACCENT, color: BG }}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Add habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
