const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', require('./routes/health'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/insights', require('./routes/insights'));

app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`WellBuddy backend running on http://localhost:${PORT}`));
