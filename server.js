require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { connectDB, getStatus } = require('./config/db');
const { AdulterantModel } = require('./models/Adulterant');

const authRoutes = require('./routes/authRoutes');
const adulterantRoutes = require('./routes/adulterantRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/adulterants', adulterantRoutes);
app.use('/api/analyze', analyzeRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: getStatus()
  });
});

app.use('/', pageRoutes);

const { execSync } = require('child_process');

function freePort(port) {
  try {
    // Windows: find and kill any process listening on the port
    const result = execSync(
      `netstat -ano | findstr ":${port}" | findstr "LISTENING"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (result) {
      const pid = result.trim().split(/\s+/).pop();
      if (pid && !isNaN(pid)) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[Server] Freed port ${port} (killed PID ${pid})`);
      }
    }
  } catch (_) {
    // Port was already free or taskkill not needed
  }
}

const startServer = async () => {
  try {
    await connectDB();
    await AdulterantModel.seed();
    console.log('[Seed] Adulterants database initialized with reference scientific data.');

    const server = app.listen(PORT, () => {
      console.log('=======================================================');
      console.log('🥛 MilkWise - Smart Milk Adulteration Detection System');
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`🗄️ Database Status: ${getStatus().mode}`);
      console.log('=======================================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Server] Port ${PORT} in use — clearing old process and retrying in 2s...`);
        freePort(PORT);
        setTimeout(() => {
          server.close();
          app.listen(PORT, () => {
            console.log('=======================================================');
            console.log('🥛 MilkWise - Smart Milk Adulteration Detection System');
            console.log(`🌐 Server running at: http://localhost:${PORT} (restarted)`);
            console.log(`🗄️ Database Status: ${getStatus().mode}`);
            console.log('=======================================================');
          });
        }, 2000);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
