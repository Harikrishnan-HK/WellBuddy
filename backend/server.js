const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log every incoming request with timestamp, method, path, and body
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  const from = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`\n[${time}] ${req.method} ${req.path}  from ${from}`);
  if (Object.keys(req.body).length > 0) {
    console.log('  body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use('/api/health', require('./routes/health'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/weight', require('./routes/weight'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/meditation', require('./routes/meditation'));

app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const DIST = path.join(__dirname, '../frontend/dist');
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`WellBuddy running on port ${PORT}`));
