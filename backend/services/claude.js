const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateWeeklySummary(data) {
  const { metrics, workouts, moods, meditation } = data;

  const metricsSummary = metrics
    .map(m => `${m.metric_type}: avg ${m.avg?.toFixed(1)}, min ${m.min?.toFixed(1)}, max ${m.max?.toFixed(1)}`)
    .join('\n');

  const workoutSummary = workouts
    .map(w => `${w.workout_type}: ${w.count} session(s), ${w.total_minutes?.toFixed(0)} min total`)
    .join('\n');

  const prompt = `You are a personal wellness coach analyzing my health data from the past 7 days.

Health Metrics (averages):
${metricsSummary || 'No data'}

Workouts:
${workoutSummary || 'No workouts logged'}

Mood: avg ${moods?.avg_mood?.toFixed(1) || 'N/A'}/5, Energy: avg ${moods?.avg_energy?.toFixed(1) || 'N/A'}/5

Meditation: ${meditation?.total?.toFixed(0) || 0} total minutes across ${meditation?.sessions || 0} sessions

Please provide:
1. A 2-3 sentence overall wellness summary
2. Top 3 observations (patterns, correlations, what went well or needs attention)
3. 2-3 actionable nudges for next week

Keep it concise, warm, and practical. Use markdown formatting.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

async function chatAboutHealth(userMessage, data) {
  const { metrics, workouts, moods, meditation } = data;

  const context = JSON.stringify({ metrics, workouts, moods, meditation }, null, 2);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a personal wellness coach with access to the user's last 7 days of health data.
Data: ${context}
Answer questions about their health data concisely and helpfully.`,
    messages: [{ role: 'user', content: userMessage }],
  });

  return message.content[0].text;
}

module.exports = { generateWeeklySummary, chatAboutHealth };
