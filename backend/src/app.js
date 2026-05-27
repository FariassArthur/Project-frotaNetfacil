const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { PUBLIC_DIR } = require('./config');
const { parseUpload } = require('./middleware/upload');
const { verifyAuth } = require('./middleware/auth');
const { registerRoutes } = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/files', express.static(PUBLIC_DIR));

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return parseUpload(req, res, next);
  }
  return next();
});

// Auth guard: /api/login and /api/health are public
app.use('/api/', (req, res, next) => {
  if (req.path === '/login' || req.path === '/health') {
    return next();
  }
  verifyAuth(req, res, next);
});

registerRoutes(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: String(err.message || err) });
});

module.exports = app;
