const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Import routes
const studentRoutes = require('./routes/students');
const examRoutes = require('./routes/exams');
const registrationRoutes = require('./routes/registrations');
const resultRoutes = require('./routes/results');
const grievanceRoutes = require('./routes/grievances');
const allotmentRoutes = require('./routes/allotments');

// Mount routes
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api', registrationRoutes);
app.use('/api', resultRoutes);
app.use('/api', grievanceRoutes);
app.use('/api', allotmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NEMS Backend is running' });
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const students = await db.execute('SELECT COUNT(*) AS count FROM STUDENT');
    const exams = await db.execute('SELECT COUNT(*) AS count FROM EXAM');
    const registrations = await db.execute('SELECT COUNT(*) AS count FROM REGISTRATION');
    const grievances = await db.execute('SELECT COUNT(*) AS count FROM GRIEVANCE');
    const results = await db.execute('SELECT COUNT(*) AS count FROM RESULT');

    res.json({
      students: students.rows[0].COUNT,
      exams: exams.rows[0].COUNT,
      registrations: registrations.rows[0].COUNT,
      grievances: grievances.rows[0].COUNT,
      results: results.rows[0].COUNT
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
async function start() {
  try {
    await db.initialize();
    app.listen(PORT, () => {
      console.log(`\n🚀 NEMS Server running at http://localhost:${PORT}`);
      console.log(`📂 Frontend served at http://localhost:${PORT}/index.html\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});

start();
