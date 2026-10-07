'use strict';
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function id(value, name = 'id', max = 99999999) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
    fail(400, `${name} must be a positive integer no greater than ${max}.`);
  }
  return Number(value);
}
function text(value, name, max, required = false) {
  if (value === undefined || value === null) {
    if (required) fail(400, `${name} is required.`);
    return null;
  }
  if (typeof value !== 'string') fail(400, `${name} must be a string.`);
  const result = value.trim();
  if (Buffer.byteLength(result, 'utf8') > max) fail(400, `${name} is too long (maximum ${max} UTF-8 bytes).`);
  if (!result && required) fail(400, `${name} is required.`);
  return result || null;
}
function number(value, name, min, max) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) {
    fail(400, `${name} must be a number between ${min} and ${max}.`);
  }
  return Number(value);
}
function date(value, name) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) fail(400, `${name} must be YYYY-MM-DD.`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(400, `${name} is not a valid date.`);
  return value;
}
function body(req, allowed) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail(400, 'A JSON object body is required.');
  if (Object.keys(req.body).some(key => !allowed.includes(key))) fail(400, `Allowed fields: ${allowed.join(', ')}.`);
  return req.body;
}
function query(req, allowed) {
  for (const [key, value] of Object.entries(req.query)) {
    if (!allowed.includes(key) || typeof value !== 'string') fail(400, `Allowed query parameters: ${allowed.join(', ')}. Use each parameter once.`);
  }
}
function page(req) {
  const page = req.query.page === undefined ? 1 : id(req.query.page, 'page', 1000000);
  const limit = req.query.limit === undefined ? 20 : id(req.query.limit, 'limit', 100);
  return { page, limit, offset: (page - 1) * limit };
}
function camel(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase()), value,
  ]));
}
async function rows(connection, sql, binds = {}) {
  const result = await connection.execute(sql, binds);
  return result.rows.map(camel);
}
async function one(connection, sql, binds = {}, message = 'Resource not found.') {
  const data = await rows(connection, sql, binds);
  if (!data.length) fail(404, message);
  return data[0];
}
async function paginate(connection, sql, binds, pagination) {
  // Oracle 11g has no OFFSET/FETCH. Sort inside the inner query before ROWNUM.
  const data = await rows(connection, `
    SELECT * FROM (
      SELECT results.*, ROWNUM AS PAGE_ROW FROM (${sql}) results
      WHERE ROWNUM <= :upperBound
    ) WHERE PAGE_ROW > :lowerBound`, {
    ...binds, upperBound: pagination.offset + pagination.limit, lowerBound: pagination.offset,
  });
  data.forEach(row => delete row.pageRow);
  return { data, page: pagination.page, limit: pagination.limit };
}
async function affected(connection, sql, binds) {
  const result = await connection.execute(sql, binds);
  if (!result.rowsAffected) fail(404, 'Resource not found.');
}
function like(value) { return `%${value.replace(/[\\%_]/g, '\\$&')}%`; }
module.exports = { fail, id, text, number, date, body, query, page, camel, rows, one, paginate, affected, like };
