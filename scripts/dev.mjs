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
for (const s of SVCS) st[s.name] = { status: 'starting', url: null, proc: null, exitCode: null, readyTime: null, rls: [] };

let allSettled = false, cleaning = false, redrawPending = false;

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function clean(t) {
  return t
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1B\[\?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1B\].*?\x07/g, '')
    .replace(/\x1B\([0-9A-Za-z]/g, '')
    .replace(/\x9B[0-9;]*[a-zA-Z]/g, '');
}

function wl(...a) {
  try { stdout.write(a.join(' ') + '\r\n'); } catch {}
}

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
  wl(`╔${'═'.repeat(wd - 2)}╗`);
  wl(bline(`${B}${CY}Second Brain Dev Server${R}`));
  wl(bline(`${D}starting all services...${R}`));
  wl(`╚${'═'.repeat(wd - 2)}╝`);
  wl('');
}

function printBox() {
  const wd = tw();
  wl(`╔${'═'.repeat(wd - 2)}╗`);
  for (const s of SVCS) {
    const t = st[s.name];
    if (t.url) {
      const url = t.url.replace(/^https?:\/\//, '').replace(/0\.0\.0\.0/, 'localhost');
      wl(bline(`${GR}◉${R} ${s.color}${s.name}${R} → ${BL}${url}${R}${' '.repeat(Math.max(0, 30 - url.length))}${GR}✓ up ${humanUp(t.readyTime)}${R}`));
    } else if (t.status === 'crashed') {
      wl(bline(`${RD}✕${R} ${RD}${s.name}${R} → ${RD}exited (code ${t.exitCode})${R}`));
    } else {
      wl(bline(`${D}◌${R} ${D}${s.name}${R} → ${D}waiting...${R}`));
    }
  }
  wl(bline(''));

  const crashed = SVCS.filter(s => st[s.name].status === 'crashed');
  if (crashed.length) {
    const names = crashed.map(s => s.name).join(', ');
    const alive = SVCS.filter(s => st[s.name].status === 'ready').map(s => s.name).join(', ') || 'none';
    wl(bline(`${RD}✕ ${names} crashed — ${alive} still running${R}`));
    wl(bline(`${D}Press${R} ${B}r${R} ${D}to restart |${R} ${B}Ctrl+C${R} ${D}to quit${R}`));
  } else if (st.api.url) {
    const base = st.api.url.replace(/\/+$/, '');
    wl(bline(` ${D}OpenAPI${R}  → ${BL}${base}/api/docs${R}`));
    wl(bline(` ${D}GraphQL${R}  → ${BL}${base}/graphql${R}`));
    wl(`╠${'═'.repeat(wd - 2)}╣`);
    wl(bline(`${D}[r] restart${R}  ${D}[c] clear${R}  ${D}[h] help${R}  ·  ${D}Ctrl+C to quit${R}`));
  }
  wl(`╚${'═'.repeat(wd - 2)}╝`);
  wl('');
}

function printHelp() {
  const wd = tw();
  wl(`╔${'═'.repeat(wd - 2)}╗`);
  wl(bline(`${B}Help${R}`)); wl(bline(''));
  wl(bline(` ${B}r${R}   Restart all crashed services`));
  wl(bline(` ${B}R${R}   Cycle and restart one crashed service`));
  wl(bline(` ${B}c${R}   Clear screen`));
  wl(bline(` ${B}h${R}   Show this help`));
  wl(bline(` ${B}q${R}   Quit (or Ctrl+C)`));
  wl(bline(''));
  wl(bline(` ${D}Log lines are prefixed with [web], [api], [ai]${R}`));
  wl(bline(` ${D}Status box updates automatically on changes${R}`));
  wl(`╚${'═'.repeat(wd - 2)}╝`);
  wl('');
}

function checkAllSettled() {
  if (allSettled) return;
  if (SVCS.every(s => st[s.name].status !== 'starting')) {
    allSettled = true;
    printBox();
  }
}

function requestRedraw() {
  if (cleaning) return;
  if (!allSettled) return checkAllSettled();
  if (redrawPending) return;
  redrawPending = true;
  setTimeout(() => { redrawPending = false; if (!cleaning) printBox(); }, 80);
}

function startService(svc) {
  let proc;
  try {
    proc = spawn('pnpm', ['run', 'dev'], {
      cwd: svc.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
  } catch (err) {
    wl(`${RD}[${svc.name}] spawn failed: ${err.message}${R}`);
    st[svc.name].status = 'crashed';
    st[svc.name].exitCode = -1;
    requestRedraw();
    return;
  }

  const previous = st[svc.name];
  for (const rl of previous.rls || []) {
    try { rl.close(); } catch {}
  }
  for (const fd of [previous.outRl, previous.errRl]) {
    if (fd) try { fd.destroy(); } catch {}
  }

  st[svc.name] = { status: 'starting', url: null, proc, exitCode: null, readyTime: null, rls: [] };
  proc.on('error', (err) => {
    if (st[svc.name]?.proc !== proc) return;
    st[svc.name].status = 'crashed';
    st[svc.name].exitCode = -1;
    requestRedraw();
  });

  const makeOnLine = (svc, proc) => (text) => {
    if (st[svc.name]?.proc !== proc) return;
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
    wl(`${D}[${R}${svc.color}${svc.name}${R}${D}]${R} ${D}${ts()}${R} ${prefix}${cleaned}`);
  };

  const onLine = makeOnLine(svc, proc);
  const onLineGuard = makeOnLine(svc, proc);

  const rlOut = createInterface({ input: proc.stdout });
  rlOut.on('line', onLine);
  const rlErr = createInterface({ input: proc.stderr });
  rlErr.on('line', onLineGuard);

  st[svc.name].rls = [rlOut, rlErr];
  st[svc.name].outRl = rlOut;
  st[svc.name].errRl = rlErr;

  proc.stdout.on('error', () => {});
  proc.stderr.on('error', () => {});

  proc.on('exit', (code) => {
    if (cleaning) return;
    if (st[svc.name]?.proc !== proc) return;
    st[svc.name].status = 'crashed';
    st[svc.name].exitCode = code;
    requestRedraw();
  });
}

function cleanup() {
  if (cleaning) return;
  cleaning = true;

  try { stdin.setRawMode(false); } catch {}

  for (const s of SVCS) {
    const t = st[s.name];
    if (!t) continue;
    for (const rl of t.rls || []) {
      try { rl.close(); } catch {}
    }
    const p = t.proc;
    if (p && !p.killed) {
      try {
        const gid = p.pid != null ? -p.pid : undefined;
        if (gid) process.kill(gid, 'SIGTERM');
      } catch {}
      if (!p.killed) try { p.kill('SIGTERM'); } catch {}
    }
  }

  setTimeout(() => {
    for (const s of SVCS) {
      const p = st[s.name]?.proc;
      if (p && !p.killed) try { p.kill('SIGKILL'); } catch {}
    }
  }, 2000).unref();

  wl(`\n${D}Bye!${R}`);

  setTimeout(() => exit(0), 100).unref();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.on('uncaughtException', (err) => {
  wl(`${RD}Fatal: ${err.message}${R}`);
  cleanup();
});
process.on('unhandledRejection', (err) => {
  wl(`${RD}Unhandled rejection: ${err}${R}`);
});

if (stdin.isTTY) {
  stdin.setRawMode(true);
  stdin.on('data', (buf) => {
    const ch = buf instanceof Buffer ? buf.toString() : buf;
    if (ch === '\u0003' || ch === 'q') cleanup();
    if (ch === 'r') {
      for (const s of SVCS) {
        if (st[s.name]?.status === 'crashed') {
          st[s.name] = { status: 'starting', url: null, proc: null, exitCode: null, readyTime: null, rls: [] };
          startService(s);
        }
      }
      requestRedraw();
    }
    if (ch === 'c') { printHeader(); printBox(); }
    if (ch === 'h') printHelp();
  });
}

printHeader();
for (const s of SVCS) startService(s);
