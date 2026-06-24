import React, { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import RefreshBtn from '../components/RefreshBtn';
import Icon from '../components/Icon';
import useSwipeTabs from '../hooks/useSwipeTabs';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';

const SUB_TABS = ['Body', 'Sleep', 'Fitness'];

const BG      = '#F6F4F1';
const CARD    = '#FFFFFF';
const DEEP    = '#E4DED2';
const ACCENT  = '#F95C4B';
const ACCENT2 = '#D9483A';
const TEXT    = '#000000';
const MUTED   = '#6B6862';
const DIM     = '#9C988F';
const BORDER  = '#E4DED2';

export default function Health({ initialSub }) {
  const [sub, setSub] = useState(initialSub || 'Body');
  useEffect(() => { if (initialSub) setSub(initialSub); }, [initialSub]);

  const fetch = useCallback(() => Promise.all([
    api.getToday(),
    api.getWeek(),
    api.getWeightLogs(),
    api.getWeightGoals(),
    api.getTrend('sleep_hours'),
    api.getTrend('hrv'),
    api.getTrend('steps'),
    api.getTrend('active_calories'),
  ]), []);
  const { data: raw, loading, refreshing, refresh } = useRefresh(fetch);
  const [today, week, weightLogs, weightGoals, sleepTrend, hrvTrend, stepsTrend, calTrend] = raw || [];

  const swipe = useSwipeTabs(SUB_TABS, sub, setSub);

  if (loading) return <Spinner />;

  const m = today?.metrics || {};

  return (
    <div className="pb-4 space-y-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
      <div className="flex items-start justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Health</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {sub === 'Body' ? 'Weight & body composition' : sub === 'Sleep' ? 'Recovery & HRV' : 'Activity & workouts'}
          </p>
        </div>
        <RefreshBtn refreshing={refreshing} onRefresh={refresh} />
      </div>

      {/* Sub-tab pills */}
      <div className="flex gap-2 px-4">
        {SUB_TABS.map(t => (
          <button key={t} onClick={() => setSub(t)}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={sub === t ? { background: ACCENT, color: BG } : { background: CARD, color: MUTED }}>
            {t}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        className="px-4 space-y-4"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        {sub === 'Body'    && <BodySection m={m} logs={weightLogs || []} goals={weightGoals || {}} onSaved={refresh} />}
        {sub === 'Sleep'   && <SleepSection m={m} sleepTrend={sleepTrend} hrvTrend={hrvTrend} />}
        {sub === 'Fitness' && <FitnessSection m={m} week={week} stepsTrend={stepsTrend} calTrend={calTrend} />}
      </div>
    </div>
  );
}

// ── BMI helpers ───────────────────────────────────────────────────────────────
function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return weight / (h * h);
}
function bmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: '#6BBCDC' };
  if (bmi < 25)   return { label: 'Normal',      color: '#7CA87A' };
  if (bmi < 30)   return { label: 'Overweight',  color: '#C4956A' };
  return                  { label: 'Obese',       color: '#C46A6A' };
}
function estimateBodyFat(bmi, age = 35) {
  if (!bmi) return null;
  return (((1.20 * bmi + 0.23 * age - 16.2) + (1.20 * bmi + 0.23 * age - 5.4)) / 2).toFixed(1);
}

// ── Body Section ──────────────────────────────────────────────────────────────
function BodySection({ m, logs, goals, onSaved }) {
  const [showEntry, setShowEntry] = useState(false);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [goalForm, setGoalForm] = useState({
    start_weight: goals.start_weight || '',
    target_weight: goals.target_weight || '',
    height_cm: goals.height_cm || '',
  });

  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight_kg : (m.weight_kg?.value || null);
  const startWeight   = goals.start_weight || null;
  const targetWeight  = goals.target_weight || null;
  const heightCm      = goals.height_cm || null;
  const bmi     = calcBMI(currentWeight, heightCm);
  const bmiCat  = bmiCategory(bmi);
  const bodyFat = estimateBodyFat(bmi);

  let progressPct = 0;
  if (startWeight && targetWeight && currentWeight) {
    const totalChange = Math.abs(targetWeight - startWeight);
    const achieved    = Math.abs(currentWeight - startWeight);
    progressPct = totalChange > 0 ? Math.min(Math.round((achieved / totalChange) * 100), 100) : 100;
  }

  const handleLogWeight = async () => {
    const w = parseFloat(inputWeight);
    if (!w || isNaN(w)) return;
    setSaving(true);
    await api.logWeight({ weight_kg: w });
    setInputWeight(''); setShowEntry(false); setSaving(false);
    onSaved();
  };

  const handleSaveGoals = async () => {
    await api.saveWeightGoals({
      start_weight: parseFloat(goalForm.start_weight) || null,
      target_weight: parseFloat(goalForm.target_weight) || null,
      height_cm: parseFloat(goalForm.height_cm) || null,
    });
    setShowGoalSetup(false);
    onSaved();
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedToday = logs.some(l => l.date === todayStr);

  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <div className="flex justify-between items-end mb-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: DIM }}>Start</p>
            <p className="text-base font-bold" style={{ color: MUTED }}>{startWeight || '—'}</p>
            <p className="text-[10px]" style={{ color: DIM }}>kg</p>
          </div>
          <div className="text-center flex-1 px-2">
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>Current</p>
            <p className="text-3xl font-bold leading-none" style={{ color: TEXT }}>
              {currentWeight ? currentWeight.toFixed(1) : '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>kg</p>
            {startWeight && currentWeight && (
              <p className="text-xs mt-1 font-medium"
                style={{ color: currentWeight <= startWeight ? '#7CA87A' : '#C4956A' }}>
                {currentWeight <= startWeight ? '▼' : '▲'} {Math.abs(currentWeight - startWeight).toFixed(1)} kg from start
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: DIM }}>Target</p>
            <p className="text-base font-bold" style={{ color: ACCENT }}>{targetWeight || '—'}</p>
            <p className="text-[10px]" style={{ color: DIM }}>kg</p>
          </div>
        </div>
        {startWeight && targetWeight ? (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: DIM }}>
              <span>Progress to goal</span><span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: DEEP }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: `linear-gradient(to right, ${ACCENT2}, ${ACCENT})` }} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-center mt-2" style={{ color: DIM }}>Set goals to track progress</p>
        )}
      </div>

      {!showEntry ? (
        <button onClick={() => setShowEntry(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold border border-dashed"
          style={loggedToday
            ? { borderColor: '#7CA87A', color: '#7CA87A', background: 'rgba(124,168,122,0.1)' }
            : { borderColor: ACCENT, color: ACCENT, background: 'rgba(249,92,75,0.1)' }}>
          {loggedToday ? `Logged today · ${currentWeight?.toFixed(1)} kg — update?` : 'Log today\'s weight'}
        </button>
      ) : (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD }}>
          <p className="text-sm font-semibold" style={{ color: TEXT }}>Enter today's weight</p>
          <div className="flex gap-2 items-center">
            <input type="number" step="0.1" min="20" max="300" placeholder="e.g. 72.5"
              value={inputWeight} onChange={e => setInputWeight(e.target.value)} autoFocus
              className="flex-1 rounded-xl px-3 py-2.5 text-lg font-bold outline-none"
              style={{ background: DEEP, color: TEXT, border: `1px solid ${BORDER}` }} />
            <span className="font-medium" style={{ color: MUTED }}>kg</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEntry(false)}
              className="flex-1 py-2 rounded-xl text-sm" style={{ color: MUTED, background: DEEP }}>Cancel</button>
            <button onClick={handleLogWeight} disabled={saving || !inputWeight}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: ACCENT, color: BG }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {(bmi || !heightCm) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-4" style={{ background: CARD }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: DIM }}>BMI</p>
            <p className="text-2xl font-bold" style={{ color: bmiCat?.color || MUTED }}>
              {bmi ? bmi.toFixed(1) : '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: bmiCat?.color || DIM }}>
              {bmiCat?.label || (heightCm ? 'No weight' : 'Set height in goals')}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: CARD }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: DIM }}>Est. Body Fat</p>
            <p className="text-2xl font-bold" style={{ color: ACCENT }}>{bodyFat ? `${bodyFat}%` : '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: DIM }}>{bodyFat ? 'BMI estimate ±5%' : 'Needs BMI'}</p>
          </div>
        </div>
      )}

      {!showGoalSetup ? (
        <button onClick={() => { setGoalForm({ start_weight: goals.start_weight || '', target_weight: goals.target_weight || '', height_cm: goals.height_cm || '' }); setShowGoalSetup(true); }}
          className="w-full py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2"
          style={{ color: DIM, background: CARD, border: `1px solid ${BORDER}` }}>
          <Icon name="settings" size={13} />
          {goals.height_cm ? 'Edit goals & height' : 'Set start weight, target & height'}
        </button>
      ) : (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD }}>
          <p className="text-sm font-semibold" style={{ color: TEXT }}>Goals & measurements</p>
          {[
            { label: 'Height', key: 'height_cm', placeholder: '170', unit: 'cm' },
            { label: 'Start weight', key: 'start_weight', placeholder: '80.0', unit: 'kg' },
            { label: 'Target weight', key: 'target_weight', placeholder: '70.0', unit: 'kg' },
          ].map(({ label, key, placeholder, unit }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs w-28 shrink-0" style={{ color: MUTED }}>{label}</label>
              <input type="number" step="0.1" placeholder={placeholder}
                value={goalForm[key]} onChange={e => setGoalForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: DEEP, color: TEXT, border: `1px solid ${BORDER}` }} />
              <span className="text-xs w-6" style={{ color: DIM }}>{unit}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowGoalSetup(false)}
              className="flex-1 py-2 rounded-xl text-sm" style={{ color: MUTED, background: DEEP }}>Cancel</button>
            <button onClick={handleSaveGoals}
              className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: ACCENT, color: BG }}>Save</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Daily weight</p>
          <p className="text-xs" style={{ color: DIM }}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        {logs.length > 0 ? <WeightChart logs={logs} target={targetWeight} /> : (
          <div className="h-40 flex flex-col items-center justify-center gap-2">
            <p className="text-sm" style={{ color: DIM }}>No data yet</p>
            <p className="text-xs" style={{ color: DIM }}>Log your first weight above</p>
          </div>
        )}
      </div>
    </>
  );
}

function WeightChart({ logs, target }) {
  const raw = logs.map(l => ({ date: l.date.slice(5), weight: parseFloat(l.weight_kg.toFixed(1)) }));
  const data = raw.length === 1 ? [raw[0], { ...raw[0] }] : raw;
  const weights = raw.map(d => d.weight);
  const minW = Math.floor(Math.min(...weights, target || Infinity) - 1);
  const maxW = Math.ceil(Math.max(...weights, target || -Infinity) + 1);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fill: DIM, fontSize: 10 }} tickLine={false} axisLine={false}
          interval={Math.floor(data.length / 4)} />
        <YAxis domain={[minW, maxW]} tick={{ fill: DIM, fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ backgroundColor: DEEP, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: MUTED }} itemStyle={{ color: ACCENT }} />
        {target && <ReferenceLine y={target} stroke={ACCENT2} strokeDasharray="4 3"
          label={{ value: `Goal ${target}`, fill: ACCENT2, fontSize: 10 }} />}
        <Line type="monotone" dataKey="weight" stroke={ACCENT} strokeWidth={2}
          dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: ACCENT }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Sleep Section ─────────────────────────────────────────────────────────────
function SleepSection({ m, sleepTrend, hrvTrend }) {
  const sleep = m.sleep_hours?.value;
  const deep  = m.sleep_deep_hours?.value;
  const rem   = m.sleep_rem_hours?.value;
  const hrv   = m.hrv?.value;
  const rhr   = m.resting_heart_rate?.value;
  const sleepScore = sleep ? Math.min(Math.round((sleep / 8) * 100), 100) : null;
  const avgHrv = hrvTrend?.length > 0
    ? Math.round(hrvTrend.reduce((s, r) => s + r.value, 0) / hrvTrend.length) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={<Icon name="moon" size={18} />} label="Sleep" value={sleep ? sleep.toFixed(1) : null} unit="hrs" />
        <MetricCard icon={<Icon name="brain" size={18} />} label="Sleep Score" value={sleepScore} unit="/ 100" />
        <MetricCard icon={<Icon name="sleep" size={18} />} label="Deep Sleep" value={deep ? deep.toFixed(1) : null} unit="hrs" />
        <MetricCard icon={<Icon name="wind" size={18} />} label="REM Sleep" value={rem ? rem.toFixed(1) : null} unit="hrs" />
        <MetricCard icon={<Icon name="heart" size={18} />} label="HRV"
          value={hrv ? Math.round(hrv) : null} unit="ms"
          sub={avgHrv ? `30d avg ${avgHrv} ms` : undefined} />
        <MetricCard icon={<Icon name="activity" size={18} />} label="Resting HR" value={rhr ? Math.round(rhr) : null} unit="bpm" />
      </div>
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <TrendChart data={sleepTrend} dataKey="value" type="bar" color={ACCENT} label="Sleep hours (30 days)" />
      </div>
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <TrendChart data={hrvTrend} dataKey="value" type="line" color={ACCENT2} label="HRV trend (ms)" />
      </div>
    </>
  );
}

// ── Fitness Section ───────────────────────────────────────────────────────────
function FitnessSection({ m, week, stepsTrend, calTrend }) {
  const steps = m.steps?.value;
  const cal   = m.active_calories?.value;
  const allWorkouts = week?.workouts || [];
  const weekCalories = allWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const weekMinutes  = allWorkouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);
  const avgSteps = stepsTrend?.length > 0
    ? Math.round(stepsTrend.reduce((s, r) => s + r.value, 0) / stepsTrend.length) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={<Icon name="stairs" size={18} />} label="Steps Today"
          value={steps ? steps.toLocaleString() : null} unit="steps"
          sub={steps ? `${Math.round((steps / 10000) * 100)}% of 10k` : undefined} />
        <MetricCard icon={<Icon name="flame" size={18} />} label="Active Cal"
          value={cal ? Math.round(cal) : null} unit="kcal" />
      </div>
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>This Week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-bold" style={{ color: ACCENT }}>{allWorkouts.length}</p><p className="text-xs" style={{ color: MUTED }}>Workouts</p></div>
          <div><p className="text-xl font-bold" style={{ color: ACCENT2 }}>{Math.round(weekCalories)}</p><p className="text-xs" style={{ color: MUTED }}>kcal</p></div>
          <div><p className="text-xl font-bold" style={{ color: '#C4956A' }}>{Math.round(weekMinutes)}</p><p className="text-xs" style={{ color: MUTED }}>min</p></div>
        </div>
      </div>
      {allWorkouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Recent Workouts</p>
          {[...allWorkouts].reverse().slice(0, 5).map((w, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: CARD }}>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                style={{ background: BG, color: ACCENT }}>
                <Icon name="bolt" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: TEXT }}>{w.workout_type || 'Workout'}</p>
                <p className="text-xs" style={{ color: MUTED }}>
                  {w.date}{w.duration_minutes ? ` · ${Math.round(w.duration_minutes)} min` : ''}{w.calories_burned ? ` · ${Math.round(w.calories_burned)} kcal` : ''}
                </p>
              </div>
              {w.avg_heart_rate && (
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#C46A6A' }}>{Math.round(w.avg_heart_rate)}</p>
                  <p className="text-[10px]" style={{ color: DIM }}>bpm avg</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <TrendChart data={stepsTrend} dataKey="value" type="bar" color={ACCENT}
          label={`Steps (30 days)${avgSteps ? ` · avg ${avgSteps.toLocaleString()}` : ''}`} />
      </div>
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <TrendChart data={calTrend} dataKey="value" type="line" color={ACCENT2} label="Active calories (30 days)" />
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
    </div>
  );
}
