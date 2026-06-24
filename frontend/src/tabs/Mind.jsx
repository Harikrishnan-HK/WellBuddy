import React, { useCallback, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import RefreshBtn from '../components/RefreshBtn';
import Icon from '../components/Icon';
import useSwipeTabs from '../hooks/useSwipeTabs';

const SUB_TABS = ['Meditation', 'Mood', 'Nutrition'];

const BG      = '#F6F4F1';
const CARD    = '#FFFFFF';
const DEEP    = '#E4DED2';
const ACCENT  = '#F95C4B';
const ACCENT2 = '#D9483A';
const TEXT    = '#000000';
const MUTED   = '#6B6862';
const DIM     = '#9C988F';
const BORDER  = '#E4DED2';

export default function Mind({ initialSub }) {
  const [sub, setSub] = useState(initialSub || 'Meditation');
  useEffect(() => { if (initialSub) setSub(initialSub); }, [initialSub]);

  const fetch = useCallback(() => Promise.all([
    api.getToday(),
    api.getMoodWeek(),
    api.getTrend('mindful_minutes'),
    api.getTrend('active_calories'),
  ]), []);
  const { data: raw, loading, refreshing, refresh } = useRefresh(fetch);
  const [today, moodWeek, medTrend, calTrend] = raw || [null, [], [], []];

  const swipe = useSwipeTabs(SUB_TABS, sub, setSub);

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const medToday = today?.meditation_minutes || m.mindful_minutes?.value || 0;
  const moodLog = today?.mood;
  const avgMood = moodWeek?.length > 0
    ? (moodWeek.reduce((s, r) => s + r.mood, 0) / moodWeek.length).toFixed(1) : null;
  const avgEnergy = moodWeek?.length > 0
    ? (moodWeek.reduce((s, r) => s + r.energy, 0) / moodWeek.length).toFixed(1) : null;
  const totalMedWeek = medTrend?.slice(-7).reduce((s, r) => s + r.value, 0) || 0;
  const medStreak = calcStreak(medTrend);
  const moodChartData = moodWeek?.map(r => ({ date: r.date, mood: r.mood, energy: r.energy })) || [];
  const activeCal = m.active_calories?.value || 0;
  const weight = m.weight_kg?.value;
  const bmr = weight ? Math.round(weight * 22) : 1600;
  const totalBurn = Math.round(bmr + activeCal);
  const avg7dCal = calTrend?.slice(-7).length > 0
    ? Math.round(calTrend.slice(-7).reduce((s, r) => s + r.value, 0) / calTrend.slice(-7).length) : null;

  return (
    <div className="pb-4 space-y-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
      <div className="flex items-start justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Mind</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {sub === 'Meditation' ? 'Mindfulness & streaks' : sub === 'Mood' ? 'Mood & energy logs' : 'Calorie burn'}
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
        {sub === 'Meditation' && (
          <MeditationSection
            medToday={medToday}
            medStreak={medStreak}
            totalMedWeek={totalMedWeek}
            avgMood={avgMood}
            avgEnergy={avgEnergy}
            medTrend={medTrend}
            onSaved={refresh}
          />
        )}

        {sub === 'Mood' && (
          <MoodSection moodLog={moodLog} moodWeek={moodWeek} moodChartData={moodChartData} />
        )}

        {sub === 'Nutrition' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard icon={<Icon name="flame" size={18} />} label="Active Cal"
                value={activeCal ? Math.round(activeCal) : null} unit="kcal" />
              <MetricCard icon={<Icon name="bar-chart" size={18} />} label="7-day Avg"
                value={avg7dCal} unit="kcal" sub="active cal average" />
              <MetricCard icon={<Icon name="activity" size={18} />} label="Est. BMR"
                value={bmr} unit="kcal/day" sub={weight ? `based on ${weight}kg` : 'default estimate'} />
              <MetricCard icon={<Icon name="bolt" size={18} />} label="Est. Total Burn"
                value={activeCal ? totalBurn : null} unit="kcal" />
            </div>
            <div className="rounded-2xl p-4" style={{ background: CARD }}>
              <TrendChart data={calTrend} dataKey="value" type="bar" color={ACCENT} label="Active calories burned (30 days)" />
            </div>
            <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Note</p>
              <p className="text-xs leading-relaxed" style={{ color: DIM }}>
                Calorie intake requires a nutrition app (e.g. MyFitnessPal) synced to Apple Health.
                This shows <span style={{ color: MUTED }}>calorie burn</span> from Apple Watch.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Meditation Section ────────────────────────────────────────────────────────
function MeditationSection({ medToday, medStreak, totalMedWeek, avgMood, avgEnergy, medTrend, onSaved }) {
  const [showEntry, setShowEntry] = useState(false);
  const [inputMins, setInputMins] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const mins = parseFloat(inputMins);
    if (!mins || isNaN(mins)) return;
    setSaving(true);
    await api.logMeditation({ duration_minutes: mins });
    setSaving(false);
    setShowEntry(false);
    setInputMins('');
    onSaved();
  };

  return (
    <>
      {/* Meditation today — tappable to log */}
      <MetricCard
        icon={<Icon name="lotus" size={18} />}
        label="Meditation Today"
        value={medToday ? Math.round(medToday) : null}
        unit="min"
        sub={medToday ? 'Tap to update' : 'Tap to log'}
        onClick={() => { setInputMins(medToday ? String(Math.round(medToday)) : ''); setShowEntry(true); }}
      />

      {/* Manual entry sheet */}
      {showEntry && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD }}>
          <p className="text-sm font-semibold" style={{ color: TEXT }}>
            {medToday ? 'Update meditation' : 'Log meditation'}
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number" step="1" min="1" max="300"
              placeholder={medToday ? String(Math.round(medToday)) : 'e.g. 15'}
              value={inputMins}
              onChange={e => setInputMins(e.target.value)}
              autoFocus
              className="flex-1 rounded-xl px-3 py-2.5 text-lg font-bold outline-none"
              style={{ background: DEEP, color: TEXT, border: `1px solid ${BORDER}` }}
            />
            <span className="font-medium" style={{ color: MUTED }}>min</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowEntry(false)}
              className="flex-1 py-2 rounded-xl text-sm" style={{ color: MUTED, background: DEEP }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !inputMins}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: ACCENT, color: BG }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <MetricCard icon={<Icon name="trophy" size={18} />} label="Streak"
        value={medStreak || null} unit="days" sub="consecutive days" />

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>This Week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold" style={{ color: ACCENT }}>{Math.round(totalMedWeek)}</p>
            <p className="text-xs" style={{ color: MUTED }}>med min</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: '#C4956A' }}>{avgMood || '—'}</p>
            <p className="text-xs" style={{ color: MUTED }}>avg mood</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: ACCENT2 }}>{avgEnergy || '—'}</p>
            <p className="text-xs" style={{ color: MUTED }}>avg energy</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <TrendChart data={medTrend} dataKey="value" type="bar" color={ACCENT} label="Meditation minutes (30 days)" />
      </div>
    </>
  );
}

// ── Mood Section ──────────────────────────────────────────────────────────────
const MOOD_EMOJI   = ['','😞','😕','😐','🙂','😄'];
const ENERGY_EMOJI = ['','🪫','😴','⚡','🔋','🚀'];
const MOOD_TEXT    = ['','Rough','Low','Okay','Good','Great'];
const ENERGY_TEXT  = ['','Drained','Tired','Decent','Energised','Wired'];

function MoodSection({ moodLog, moodWeek, moodChartData }) {
  return (
    <>
      {/* Mood + Energy — emoji centered, no text label */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-1" style={{ background: CARD }}>
          <span className="text-5xl leading-none">{moodLog ? MOOD_EMOJI[moodLog.mood] : '—'}</span>
          {moodLog && <p className="text-xs mt-1" style={{ color: MUTED }}>{MOOD_TEXT[moodLog.mood]}</p>}
          {!moodLog && <p className="text-xs mt-1" style={{ color: DIM }}>No log today</p>}
        </div>
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-1" style={{ background: CARD }}>
          <span className="text-5xl leading-none">{moodLog ? ENERGY_EMOJI[moodLog.energy] : '—'}</span>
          {moodLog && <p className="text-xs mt-1" style={{ color: MUTED }}>{ENERGY_TEXT[moodLog.energy]}</p>}
          {!moodLog && <p className="text-xs mt-1" style={{ color: DIM }}>No log today</p>}
        </div>
      </div>

      {moodChartData.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: CARD }}>
          <TrendChart data={moodChartData} dataKey="mood" type="line" color={ACCENT} label="Mood this week (1–5)" />
        </div>
      )}

      {moodWeek?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Mood Log</p>
          {[...moodWeek].reverse().slice(0, 7).map((r, i) => (
            <div key={i} className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: CARD }}>
              <div>
                <p className="text-xs" style={{ color: MUTED }}>{r.date}{r.time && ` · ${r.time}`}</p>
                {r.note && <p className="text-xs mt-0.5 italic" style={{ color: TEXT }}>"{r.note}"</p>}
              </div>
              <div className="flex gap-3 text-xl">
                <span>{MOOD_EMOJI[r.mood]}</span>
                <span>{ENERGY_EMOJI[r.energy]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!moodWeek || moodWeek.length === 0) && (
        <div className="rounded-2xl p-4 border border-dashed text-center" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-sm" style={{ color: MUTED }}>No mood logs this week.</p>
          <p className="text-xs mt-1" style={{ color: DIM }}>Log your mood from the Today tab.</p>
        </div>
      )}
    </>
  );
}

function calcStreak(trend) {
  if (!trend?.length) return 0;
  const dateSet = new Set(trend.filter(r => r.value > 0).map(r => r.date));
  let streak = 0, d = new Date();
  while (true) {
    if (dateSet.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
    </div>
  );
}
