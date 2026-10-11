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

    1: [409, 'This record or association already exists. For profiles, check whether the email is already in use.'],
    20011: [409, 'Itineraries in a completed trip cannot be added, edited or deleted.'],
    20012: [404, 'The parent trip does not exist.'],
    20013: [400, 'The trip and itinerary need valid start and end dates.'],
    20014: [400, 'Itinerary dates must fall within the parent trip dates.'],
    20015: [409, 'These itinerary dates conflict with an event already in the itinerary.'],
    20021: [409, 'Completed trips cannot be edited or deleted.'],
    20022: [400, 'The trip start date cannot be after its end date.'],
    20023: [409, 'These trip dates would invalidate an existing itinerary.'],
    20031: [409, 'POIs cannot be added to or removed from a completed trip.'],
    20032: [404, 'The target itinerary or parent trip does not exist.'],
    20033: [409, 'The event dates do not overlap the itinerary dates. Choose a different itinerary or date range.'],
    2291: [400, 'A referenced record does not exist.'],
    2292: [409, 'This record has dependent records. Remove them first.'],
    2290: [400, 'The values violate a database constraint.'],
    1400: [400, 'A required field is missing.'],
    12899: [400, 'A field exceeds its database length limit.'],
    1438: [400, 'A number exceeds its database precision.'],
    60: [409, 'Concurrent update conflict. Retry the request.'],
  };
  const mapped = messages[error.errorNum];
  if (mapped) return res.status(mapped[0]).json({ error: mapped[1], code: `ORA-${String(error.errorNum).padStart(5, '0')}` });
  // Never log connection objects, request bodies, credentials, or raw Oracle messages.
  console.error('Request failed:', error.code || 'INTERNAL_ERROR');
  res.status(503).json({ error: 'The database operation could not be completed.' });
});
module.exports = app;
