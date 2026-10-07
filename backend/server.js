'use strict';
const db = require('./src/config/database');
const app = require('./src/app');
let server, stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (server) await new Promise(resolve => server.close(resolve));
  await db.close();
}
async function start() {
  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  await db.initialize();
  await db.read(c => c.execute('SELECT 1 FROM DUAL'));
  server = app.listen(port, '127.0.0.1', () => console.log(`Tourism API: http://localhost:${port}/api`));
  server.on('error', async error => {
    console.error('Server failed:', error.code || 'SERVER_ERROR');
    await stop(); process.exitCode = 1;
  });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  stop().catch(() => { console.error('Shutdown failed.'); process.exitCode = 1; });
});
start().catch(async error => {
  console.error('Startup failed:', error.code || 'Check your local environment configuration.');
  await db.close(); process.exitCode = 1;
});
