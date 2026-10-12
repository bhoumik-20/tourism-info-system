'use strict';
// Run from any directory: node hosting/team-connection.cjs start|status|stop
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const root = __dirname;
const runtime = path.join(root, '.runtime');
const statePath = path.join(runtime, 'state.json');
const keyPath = path.join(root, '.env.team');
const gatewayScript = path.join(root, 'gateway.cjs');
const tunnelExe = path.join(runtime, 'cloudflared.exe');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const readState = () => fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
function writeState(state) {
  fs.writeFileSync(statePath + '.tmp', JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(statePath + '.tmp', statePath);
}
function matches(pid, kind) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    `Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' | Select-Object ExecutablePath,CommandLine | ConvertTo-Json -Compress`],
    { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('Unable to verify process ownership. No process was stopped.');
  if (!result.stdout.trim()) return false;
  const processInfo = JSON.parse(result.stdout);
  return kind === 'tunnel' ? processInfo.ExecutablePath?.toLowerCase() === tunnelExe.toLowerCase()
    : processInfo.CommandLine?.toLowerCase().includes(gatewayScript.toLowerCase());
}
function background(executable, args, env, logName) {
  const fd = fs.openSync(path.join(runtime, logName), 'w');
  const child = spawn(executable, args, { env, detached: true, windowsHide: true, stdio: ['ignore', fd, fd] });
  fs.closeSync(fd);
  child.unref();
  return child;
}
async function main() {
  fs.mkdirSync(runtime, { recursive: true });
  const command = process.argv[2] || 'status';
  const state = readState();
  if (command === 'status') {
    console.log(JSON.stringify({ gatewayRunning: matches(state.gatewayPid, 'gateway'), tunnelRunning: matches(state.tunnelPid, 'tunnel'), backendUrl: state.backendUrl || null }, null, 2));
    return;
  }
  if (command === 'stop') {
    for (const [key, kind] of [['tunnelPid', 'tunnel'], ['gatewayPid', 'gateway']]) {
      if (matches(state[key], kind)) process.kill(state[key]);
    }
    writeState({});
    console.log('Team connection stopped. Oracle and the existing backend were left running.');
    return;
  }
  if (command !== 'start') throw new Error('Use start, status or stop.');
  if (matches(state.gatewayPid, 'gateway') || matches(state.tunnelPid, 'tunnel')) {
    console.log('A team connection is already running. Use status, or stop before restarting.');
    return;
  }
  if (!fs.existsSync(tunnelExe)) throw new Error('Place the official Windows x64 cloudflared.exe in hosting/.runtime first. See hosting/README.md.');
  const health = await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(5000) });
  if (!health.ok) throw new Error('Start Oracle and the existing backend first.');
  if (!fs.existsSync(keyPath)) fs.writeFileSync(keyPath, 'VOYAGE_TUNNEL_KEY=' + crypto.randomBytes(32).toString('hex') + '\n', { flag: 'wx', mode: 0o600 });
  process.loadEnvFile(keyPath);
  if (!/^[a-f0-9]{64}$/.test(process.env.VOYAGE_TUNNEL_KEY || '')) throw new Error('The local team tunnel key is missing or invalid.');
  const gateway = background(process.execPath, [gatewayScript], process.env, 'gateway.log');
  writeState({ gatewayPid: gateway.pid });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      try { ready = (await fetch('http://127.0.0.1:5001/api/health')).status === 401; } catch {}
      if (ready) break;
      await wait(250);
    }
    if (!ready) throw new Error('The protected gateway could not start. Check its local log and port 5001.');
    const tunnel = background(tunnelExe, ['tunnel', '--url', 'http://127.0.0.1:5001', '--protocol', 'http2', '--no-autoupdate'], process.env, 'tunnel.log');
    const nextState = { gatewayPid: gateway.pid, tunnelPid: tunnel.pid };
    writeState(nextState);
    for (let attempt = 0; attempt < 90; attempt++) {
      const log = fs.readFileSync(path.join(runtime, 'tunnel.log'), 'utf8');
      const url = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (url) {
        nextState.backendUrl = url[0];
        writeState(nextState);
        console.log('Team connection started. Backend URL: ' + url[0]);
        console.log('Configure VOYAGE_BACKEND_URL in Sites. The separate VOYAGE_TUNNEL_KEY remains in hosting/.env.team; store it as a Sites secret, never in frontend code.');
        return;
      }
      await wait(1000);
    }
    throw new Error('The tunnel did not return a URL. Check hosting/.runtime/tunnel.log, stop the connection and retry.');
  } catch (error) {
    // Retain owned process IDs so the explicit stop command can safely clean up.
    throw error;
  }
}
main().catch(error => { console.error(error.message || 'Team connection failed.'); process.exitCode = 1; });
