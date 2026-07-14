require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { PUBLIC_DIR, CORS_ORIGIN, NODE_ENV } = require('./config');
const { parseUpload } = require('./middleware/upload');
const { verifyAuth } = require('./middleware/auth');
const { registerRoutes } = require('./api/routes');
const { sanitizeError } = require('./services/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));
app.use(cors({
  origin: CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const requestPath = String(req.originalUrl || req.url || '');
  const skipUploadMiddleware = requestPath.startsWith('/api/importar/csv');
  if (contentType.startsWith('multipart/form-data') && !skipUploadMiddleware) {
    return parseUpload(req, res, next);
  }
  return next();
});

// Auth guard: /api/login, /api/health and import model templates are public
app.use('/api/', (req, res, next) => {
  if (req.path === '/login') {
    return loginLimiter(req, res, next);
  }
  if (req.path === '/health' || req.path.startsWith('/importar/csv/modelo')) {
    return next();
  }
  if (req.path.startsWith('/files/')) {
    return verifyAuth(req, res, next);
  }
  apiLimiter(req, res, (err) => {
    if (err) return next(err);
    verifyAuth(req, res, next);
  });
});

// Protected file download
const PUBLIC_DIR_RESOLVED = path.resolve(PUBLIC_DIR);

app.get('/api/files/:filePath(*)', (req, res) => {
  const requestedPath = path.resolve(path.join(PUBLIC_DIR_RESOLVED, req.params.filePath || ''));
  if (!requestedPath.startsWith(PUBLIC_DIR_RESOLVED)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (!fs.existsSync(requestedPath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  res.download(requestedPath);
});

registerRoutes(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: sanitizeError(err) });
});

module.exports = app;
