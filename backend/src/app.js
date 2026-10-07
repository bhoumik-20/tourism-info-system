'use strict';
const express = require('express');
const cors = require('cors');
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb', strict: true }));
app.use('/api', require('./routes/api'));
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  const messages = {
    1: [409, 'This record or association already exists.'],
    2291: [400, 'A referenced record does not exist.'],
    2292: [409, 'This record has dependent records. Remove them first.'],
    2290: [400, 'The values violate a database constraint.'],
    1400: [400, 'A required field is missing.'],
    12899: [400, 'A field exceeds its database length limit.'],
    1438: [400, 'A number exceeds its database precision.'],
    60: [409, 'Concurrent update conflict. Retry the request.'],
  };
  const mapped = messages[error.errorNum];
  if (mapped) return res.status(mapped[0]).json({ error: mapped[1] });
  // Never log connection objects, request bodies, credentials, or raw Oracle messages.
  console.error('Request failed:', error.code || 'INTERNAL_ERROR');
  res.status(503).json({ error: 'The database operation could not be completed.' });
});
module.exports = app;
