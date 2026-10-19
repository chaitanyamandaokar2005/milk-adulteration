require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { connectDB, disconnectDB, getStatus } = require('./config/db');
const { AdulterantModel } = require('./models/Adulterant');
const { isCloudinaryEnabled } = require('./services/imageStore');
const { securityHeaders } = require('./config/security');
const { sanitizeRequest } = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimits');

const authRoutes = require('./routes/authRoutes');
const adulterantRoutes = require('./routes/adulterantRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-me'))) {
  console.error('[Config] Set a strong JWT_SECRET before starting in production.');
  process.exit(1);
}

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(securityHeaders());
app.use(sanitizeRequest);
app.use('/api', apiLimiter);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/adulterants', adulterantRoutes);
app.use('/api/analyze', analyzeRoutes);

app.get('/api/health', (req, res) => {
  const database = getStatus();
  const ok = database.isMongoConnected;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    service: 'MilkWise',
    timestamp: new Date().toISOString(),
    database,
    storage: isCloudinaryEnabled() ? 'cloudinary' : 'local-disk'
  });
});

app.use('/', pageRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).render('notfound', {
    page: '404',
    title: 'Not found',
    layout: 'auth',
    scripts: [],
    adulterants: []
  });
});

let server;

const startServer = async () => {
  try {
    await connectDB();
    await AdulterantModel.seed();
    console.log('[Seed] Adulterant reference standards loaded into MongoDB.');

    if (isProd && !isCloudinaryEnabled()) {
      console.warn('[Config] CLOUDINARY_* is not set. Strip photos live on local disk and will vanish on most PaaS restarts.');
    }
    if (isProd && (!process.env.APP_URL || process.env.APP_URL.includes('localhost'))) {
      console.warn('[Config] Set APP_URL to your public HTTPS origin (e.g. https://your-app.onrender.com).');
    }

    server = app.listen(PORT, HOST, () => {
      console.log('=======================================================');
      console.log('MilkWise - Smart milk adulteration detection');
      console.log(`Server: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`Database: ${getStatus().mode}`);
      console.log(`Strip storage: ${isCloudinaryEnabled() ? 'Cloudinary' : 'local uploads folder'}`);
      console.log('=======================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  }
};

async function shutdown(signal) {
  console.log(`[Server] ${signal} received, shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
