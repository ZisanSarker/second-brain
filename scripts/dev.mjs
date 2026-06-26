#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';

const R  = '\x1b[0m',  B  = '\x1b[1m',  D  = '\x1b[2m';
const RD = '\x1b[31m', GR = '\x1b[32m', YE = '\x1b[33m', BL = '\x1b[34m', CY = '\x1b[36m';

const SVCS = [
  { name: 'web', color: CY, cwd: 'apps/web', rx: /Local:\s+(http:\/\/\S+)/ },
  { name: 'api', color: GR, cwd: 'apps/api', rx: /NestJS Server running on (http:\/\/\S+)/ },
  { name: 'ai',  color: YE, cwd: 'apps/ai',  rx: /Uvicorn running on (http:\/\/\S+)/ },
];

const st = {};
for (const s of SVCS) st[s.name] = { status: 'starting', url: null, proc: null, exitCode: null, readyTime: null };

let allReady = false, cleaning = false, redrawPending = false;

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function clean(t) { return t.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B\].*?\x07/g, ''); }

function w(...a) { stdout.write(a.join(' ') + '\n'); }

function tw() { return Math.min(stdout.columns || 80, 100); }

function pad(content) {
  const vis = clean(content).length;
  return content + ' '.repeat(Math.max(0, tw() - 4 - vis));
}

function bline(content) { return `║ ${pad(content)} ║`; }

function humanUp(t) {
  if (!t) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function printHeader() {
  const wd = tw();
  stdout.write('\x1Bc');
  w(`╔${'═'.repeat(wd - 2)}╗`);
  w(bline(`${B}${CY}Second Brain Dev Server${R}`));
  w(bline(`${D}starting all services...${R}`));
  w(`╚${'═'.repeat(wd - 2)}╝`);
  w('');
}

function printBox() {
  const wd = tw();
  w(`╔${'═'.repeat(wd - 2)}╗`);
  for (const s of SVCS) {
    const t = st[s.name];
    if (t.url) {
      const url = t.url.replace(/^https?:\/\//, '').replace(/0\.0\.0\.0/, 'localhost');
      w(bline(`${GR}◉${R} ${s.color}${s.name}${R} → ${BL}${url}${R}${' '.repeat(Math.max(0, 30 - url.length))}${GR}✓ up ${humanUp(t.readyTime)}${R}`));
    } else if (t.status === 'crashed') {
      w(bline(`${RD}✕${R} ${RD}${s.name}${R} → ${RD}exited (code ${t.exitCode})${R}`));
    } else {
      w(bline(`${D}◌${R} ${D}${s.name}${R} → ${D}waiting...${R}`));
    }
  }
  w(bline(''));

  const crashed = SVCS.filter(s => st[s.name].status === 'crashed');
  if (crashed.length) {
    const names = crashed.map(s => s.name).join(', ');
    const alive = SVCS.filter(s => st[s.name].status === 'ready').map(s => s.name).join(', ') || 'none';
    w(bline(`${RD}✕ ${names} crashed — ${alive} still running${R}`));
    w(bline(`${D}Press${R} ${B}r${R} ${D}to restart |${R} ${B}Ctrl+C${R} ${D}to quit${R}`));
  } else if (st.api.url) {
    const base = st.api.url.replace(/\/+$/, '');
    w(bline(` ${D}OpenAPI${R}  → ${BL}${base}/api/docs${R}`));
    w(bline(` ${D}GraphQL${R}  → ${BL}${base}/graphql${R}`));
    w(`╠${'═'.repeat(wd - 2)}╣`);
    w(bline(`${D}[r] restart${R}  ${D}[c] clear${R}  ${D}[h] help${R}  ·  ${D}Ctrl+C to quit${R}`));
  }
  w(`╚${'═'.repeat(wd - 2)}╝`);
  w('');
}

function printHelp() {
  const wd = tw();
  w(`╔${'═'.repeat(wd - 2)}╗`);
  w(bline(`${B}Help${R}`)); w(bline(''));
  w(bline(` ${B}r${R}   Restart all crashed services`));
  w(bline(` ${B}R${R}   Cycle and restart one crashed service`));
  w(bline(` ${B}c${R}   Clear screen`));
  w(bline(` ${B}h${R}   Show this help`));
  w(bline(` ${B}q${R}   Quit (or Ctrl+C)`));
  w(bline(''));
  w(bline(` ${D}Log lines are prefixed with [web], [api], [ai]${R}`));
  w(bline(` ${D}Status box updates automatically on changes${R}`));
  w(`╚${'═'.repeat(wd - 2)}╝`);
  w('');
}

function checkAllReady() {
  if (allReady) return;
  if (SVCS.every(s => st[s.name].status !== 'starting')) {
    allReady = true;
    printBox();
  }
}

function requestRedraw() {
  if (cleaning) return;
  if (!allReady) return checkAllReady();
  if (redrawPending) return;
  redrawPending = true;
  setTimeout(() => { redrawPending = false; if (!cleaning) printBox(); }, 80);
}

function startService(svc) {
  const proc = spawn('pnpm', ['run', 'dev'], {
    cwd: svc.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });
  st[svc.name].proc = proc;

  const onLine = (text) => {
    const line = text.replace(/\r$/, '');
    if (!line.trim()) return;
    const cleaned = clean(line);
    const m = cleaned.match(svc.rx);
    if (m && st[svc.name].status === 'starting') {
      st[svc.name].status = 'ready';
      st[svc.name].url = m[1];
      st[svc.name].readyTime = Date.now();
      requestRedraw();
    }

    const hasError = !/0 errors|no errors/i.test(cleaned) && /error|fatal/i.test(cleaned);
    const hasWarn = !/0 warnings|no warnings/i.test(cleaned) && /warn/i.test(cleaned);
    const prefix = hasError ? `${RD}✖${R} ` : hasWarn ? `${YE}⚠${R} ` : '';
    w(`${D}[${R}${svc.color}${svc.name}${R}${D}]${R} ${D}${ts()}${R} ${prefix}${cleaned}`);
  };

  createInterface({ input: proc.stdout }).on('line', onLine);
  createInterface({ input: proc.stderr }).on('line', onLine);

  proc.on('exit', (code) => {
    if (cleaning) return;
    if (st[svc.name].proc !== proc) return;
    st[svc.name].status = 'crashed';
    st[svc.name].exitCode = code;
    requestRedraw();
  });
}

function cleanup() {
  if (cleaning) return;
  cleaning = true;
  for (const s of SVCS) {
    const p = st[s.name].proc;
    if (p && !p.killed) p.kill('SIGTERM');
  }
  w(`\n${D}Bye!${R}`);
  exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

if (stdin.isTTY) {
  stdin.setRawMode(true);
  stdin.on('data', (key) => {
    if (key === '\u0003' || key === 'q') cleanup();
    if (key === 'r') {
      for (const s of SVCS) {
        if (st[s.name].status === 'crashed') {
          st[s.name] = { status: 'starting', url: null, proc: null, exitCode: null, readyTime: null };
          startService(s);
        }
      }
      requestRedraw();
    }
    if (key === 'c') { printHeader(); printBox(); }
    if (key === 'h') printHelp();
  });
}

printHeader();
for (const s of SVCS) startService(s);
