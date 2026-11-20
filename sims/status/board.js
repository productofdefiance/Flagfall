#!/usr/bin/env node
/* Status board (Brief 021). Builds one small board for the Editor: VERSION, RESULTS, FLAGS, BUILDS, CHATS.
   - buildBoard(facts) turns plain facts into the board (text, sections, json). No network: the test feeds it fixtures.
   - gather(opts) collects the facts from the repository: files through git (no API limit), pull requests, checks and
     the night checks through `gh api` with the workflow's token.
   Run:  node sims/status/board.js <out folder>      (from the top of a clone whose `origin` is the GitHub repository)
   Writes BOARD.md, board.json and index.html into <out folder> (each through a temp file, then renamed), and prints
   `changed=true` or `changed=false`: false when the board says the same as the one already on the `status` branch.
   Node 20, no packages. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const LIMITS = { results: 8, flags: 12, merged: 3, closedChats: 5, staleDays: 3, maxBytes: 4096 };
const FLAG_OPEN = ["OPEN", "ASK", "DECIDE", "TEST"];
const FLAG_BANG = ["ASK", "DECIDE"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------- small helpers ----------

/** "20 Nov 2026, 3:40 am ET" (US Eastern). */
function etTime(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true
  }).formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${String(p.dayPeriod).toLowerCase()} ET`;
}
/** "20 Nov" (US Eastern). */
function etDay(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })
    .formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month}`;
}
/** "2026-11-20" → "20 Nov". */
function isoDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : String(s || "");
}
/** Plain one-line text, cut at a word boundary to about n characters. */
function cut(s, n) {
  s = String(s || "").replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const head = s.slice(0, n);
  const sp = head.lastIndexOf(" ");
  return (sp > n * 0.6 ? head.slice(0, sp) : head).replace(/[\s,;:.(–-]+$/, "") + "…";
}
const pad3 = (n) => String(n).padStart(3, "0");
/** "v3.10.00" → [3,10,0] (null if not a version). */
function ver(v) { const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(String(v || "")); return m ? m.slice(1).map(Number) : null; }
function verGreater(a, b) {
  const x = ver(a), y = ver(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
/** "20 Nov" (no year) → a Date, taking the year that puts it no more than ~2 months in the future. */
function flagDate(s, now) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(String(s || ""));
  if (!m) return new Date(0);
  const mon = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  if (mon < 0) return new Date(0);
  const n = new Date(now);
  let d = new Date(Date.UTC(n.getUTCFullYear(), mon, Number(m[1])));
  if (d - n > 62 * 864e5) d = new Date(Date.UTC(n.getUTCFullYear() - 1, mon, Number(m[1])));
  return d;
}
/** Natural order of flag names: F9 < F10 < F021-1 < F021-2. */
function nameKey(name) {
  return String(name).replace(/\d+/g, (d) => d.padStart(6, "0"));
}
/** The brief number a pull request title names: "v3.10.00 · 011 Rules · …", "019 Bot · … (YY)", "Brief 006: …". */
function briefFromTitle(title) {
  const m = /(?:^|·\s*|\bBrief\s+)(\d{3})(?=[\s:·]|$)/i.exec(String(title || ""));
  return m ? m[1] : null;
}
/** The short name after "NNN Lane · " in a title, without a trailing "(YY)". */
function nameFromTitle(title) {
  const t = String(title || "");
  const m = /\d{3}\s+\w+\s+·\s+(.+)$/.exec(t) || /Brief\s+\d{3}[^:]*:\s*(.+)$/i.exec(t);
  return m ? m[1].replace(/\s*\((X|YY|ZZ|none)\)\s*$/i, "").trim() : t;
}
/** "victory-values" → "Victory values". */
function nameFromSlug(slug) {
  const s = String(slug || "").replace(/^\d{3}-/, "").replace(/-/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

// ---------- parsing files ----------

/** Rows of a flags table (FLAGS.md or flags/NNN.md): name, date, status, issue. */
function parseFlags(md) {
  const rows = [];
  for (const line of String(md || "").split("\n")) {
    if (!/^\|\s*F[\w-]*\d/.test(line)) continue;
    const c = line.split("|").slice(1, -1).map((x) => x.trim());
    if (c.length < 5) continue;
    rows.push({ name: c[0], date: c[1], issue: c[3], status: (c[4].replace(/[`*]/g, "").split(/\s+/)[0] || "").toUpperCase(), raw: line.trim() });
  }
  return rows;
}
/** A brief's header: the `Waits on` row (null when the row is missing) and the size of its version bump. */
function parseBrief(md) {
  const text = String(md || "");
  const row = (label) => {
    const m = new RegExp(`^\\|\\s*${label}\\s*\\|(.*)\\|\\s*$`, "im").exec(text);
    return m ? m[1].trim() : null;
  };
  const w = row("Waits on");
  let waitsOn = null;
  if (w !== null) waitsOn = /^\**\s*none\b/i.test(w.replace(/[<>"]/g, "")) ? [] : (w.match(/\b\d{3}\b/g) || []);
  const g = row("Game version");
  let size = null;
  if (g !== null) {
    if (/^\**\s*none\b/i.test(g)) size = "none";
    else { const m = /\b(X|YY|ZZ)\b/.exec(g); size = m ? m[1] : null; }
  }
  const title = (/^#\s+(.+)$/m.exec(text) || [])[1] || "";
  return { waitsOn, size, title };
}
/** A tiny CSV reader (quotes, doubled quotes, commas and newlines inside quotes). */
function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (ch !== "\r") f += ch;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
/** A chat log file: `key: value` lines. */
function parseChat(md) {
  const o = {};
  for (const line of String(md || "").split("\n")) {
    const m = /^\s*([a-z][a-z ]*?)\s*:\s*(.*)$/i.exec(line);
    if (m && !(m[1].toLowerCase() in o)) o[m[1].toLowerCase()] = m[2].trim();
  }
  return { name: o.name || "", subject: o.subject || "", opened: o.opened || "", status: (o.status || "").toLowerCase(), closed: o.closed || "", finalName: o["final name"] || "", outcome: o.outcome || "" };
}
/** "2026-11-20 15:40 ET" or "20 Nov 2026, 3:40 pm ET" → "20 Nov"; anything else is shown as written. */
function shortChatDate(s) {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
  if (iso) return `${Number(iso[3])} ${MONTHS[Number(iso[2]) - 1]}`;
  const dm = /(\d{1,2})\s+([A-Za-z]{3})/.exec(String(s || ""));
  return dm ? `${Number(dm[1])} ${dm[2]}` : String(s || "");
}

// ---------- the board ----------

/**
 * facts = {
 *   now, main: { game, build, rules, brain }, nightly: { conclusion, time } | null,
 *   results: [{ id, date, version, kind, answer }]            (main and open lab pull requests; duplicates allowed),
 *   flags:   [{ name, date, status, issue, fromPr, pr, added }] (main rows, and rows a pull request added or changed;
 *            added = the name was not in the pull request's merge base),
 *   briefs:  [{ num, slug, waitsOn: [..] | null, size }]       (one per brief/NNN-* branch),
 *   prs:     [{ number, title, state: "open"|"merged", draft, mergedAt, brief, checks, review, game, size }],
 *   chats:   [{ file, name, subject, opened, status, closed, finalName, outcome, lastChange }]
 * }
 */
function buildBoard(facts, opts) {
  opts = opts || {};
  const L = Object.assign({ resultChars: 110, flagChars: 90 }, opts.lengths);
  const now = new Date(facts.now);
  const sections = [];
  const line = (text, indent, mark) => ({ text, indent: indent || 1, mark: mark || null });

  // Briefs and their pull requests.
  const briefs = new Map();
  for (const b of facts.briefs || []) briefs.set(b.num, b);
  const prs = (facts.prs || []).filter((p) => p.brief);
  const open = prs.filter((p) => p.state === "open").sort((a, b) => a.brief.localeCompare(b.brief) || a.number - b.number);
  const merged = prs.filter((p) => p.state === "merged").sort((a, b) => String(b.mergedAt).localeCompare(String(a.mergedAt)));
  const mergedSet = new Set(merged.map((p) => p.brief));
  const openSet = new Set(open.map((p) => p.brief));
  const briefName = (num, pr) => {
    const b = briefs.get(num);
    return (b && b.slug ? nameFromSlug(b.slug) : "") || (pr ? nameFromTitle(pr.title) : "");
  };

  // VERSION
  const m = facts.main || {};
  const building = open.map((p) => {
    const taken = p.game && verGreater(p.game, m.game);
    const size = p.size || (briefs.get(p.brief) || {}).size;
    return `${p.brief} → ${taken ? p.game : size || "?"}`;
  });
  sections.push({ title: "VERSION", lines: [
    line(`On main: ${[m.game, m.build ? `Build ${m.build}` : null, m.rules ? `Rules ${m.rules}` : null, m.brain || null].filter(Boolean).join(" · ")}`),
    line(`Building: ${building.length ? building.join(" · ") : "none"}`)
  ] });

  // RESULTS
  const rl = [];
  if (facts.nightly) rl.push(line(`Nightly checks: ${facts.nightly.conclusion} (${etTime(facts.nightly.time).replace(/^(\d+ \w+) \d{4},/, "$1,")})`));
  else rl.push(line("Nightly checks: no run found"));
  const since = new Date(now - 864e5).toISOString().slice(0, 10);
  const seen = new Set();
  const recent = (facts.results || []).filter((r) => {
    if (!r.id || seen.has(r.id) || String(r.date) < since) return false;
    seen.add(r.id); return true;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  for (const r of recent.slice(0, LIMITS.results)) rl.push(line(`${[r.kind, r.version].filter(Boolean).join(" ")} · ${cut(r.answer, L.resultChars)} · ${isoDay(r.date)}`));
  if (!recent.length) rl.push(line("none"));
  if (recent.length > LIMITS.results) rl.push(line(`+${recent.length - LIMITS.results} more in results/INDEX.md`));
  sections.push({ title: "RESULTS (last 24 hours)", lines: rl });

  // FLAGS: a row seen in several places counts once; a pull request's copy wins.
  // An old-style number a pull request added that main has since given to another flag is a clash, not a copy: both
  // are shown, the pull request's marked with its number.
  const mainNames = new Set((facts.flags || []).filter((f) => !f.fromPr).map((f) => f.name));
  const byName = new Map();
  for (const f of facts.flags || []) {
    const clash = f.fromPr && f.added && mainNames.has(f.name);
    const key = clash ? `${f.name}@${f.pr}` : f.name;
    const row = clash ? Object.assign({}, f, { name: `${f.name} (PR #${f.pr})` }) : f;
    const had = byName.get(key);
    if (!had || f.fromPr) byName.set(key, row);
  }
  const live = [...byName.values()].filter((f) => FLAG_OPEN.includes(f.status))
    .sort((a, b) => (flagDate(b.date, now) - flagDate(a.date, now)) || nameKey(b.name).localeCompare(nameKey(a.name)));
  const fl = live.slice(0, LIMITS.flags).map((f) => {
    const bang = FLAG_BANG.includes(f.status);
    return line(`${bang ? "! " : "  "}${f.name} · ${f.status} · ${f.date} · ${cut(f.issue, L.flagChars)}`, 1, bang ? "ask" : null);
  });
  if (!live.length) fl.push(line("none"));
  if (live.length > LIMITS.flags) fl.push(line(`+${live.length - LIMITS.flags} older in FLAGS.md`));
  sections.push({ title: "FLAGS (open, newest first)", lines: fl });

  // BUILDS
  const bl = [];
  bl.push(line("Building"));
  for (const p of open) {
    const review = p.review ? `reviewed: ${p.review}` : "not reviewed";
    bl.push(line(`${p.brief} ${briefName(p.brief, p)} · PR #${p.number} · ${p.draft ? "Draft" : "Ready"} · ${p.checks && p.checks !== "none" ? `checks ${p.checks}` : "no checks yet"} · ${review}`, 2));
  }
  if (!open.length) bl.push(line("none", 2));
  const ready = [], waiting = [];
  const nums = [...briefs.keys()].filter((n) => !mergedSet.has(n) && !openSet.has(n)).sort();
  for (const n of nums) {
    const b = briefs.get(n);
    const name = `${n} ${briefName(n)}`;
    if (b.waitsOn === null || b.waitsOn === undefined) { waiting.push(line(`${name} ← not stated`, 2)); continue; }
    const missing = b.waitsOn.filter((w) => !mergedSet.has(w));
    if (missing.length) waiting.push(line(`${name} ← ${missing.join(", ")}`, 2)); else ready.push(line(name, 2));
  }
  bl.push(line("Ready to start")); bl.push(...(ready.length ? ready : [line("none", 2)]));
  bl.push(line("Waiting")); bl.push(...(waiting.length ? waiting : [line("none", 2)]));
  bl.push(line(`Merged (last ${LIMITS.merged})`));
  const lastMerged = [];
  for (const p of merged) { if (!lastMerged.find((x) => x.brief === p.brief)) lastMerged.push(p); if (lastMerged.length >= LIMITS.merged) break; }
  for (const p of lastMerged) {
    const v = (/\bv\d+\.\d+\.\d+\b/.exec(p.title) || /\bBuild \d+\b/.exec(p.title) || [])[0];
    bl.push(line([`${p.brief} ${briefName(p.brief, p)}`, v, p.mergedAt ? etDay(p.mergedAt) : null].filter(Boolean).join(" · "), 2));
  }
  if (!lastMerged.length) bl.push(line("none", 2));
  sections.push({ title: "BUILDS", lines: bl });

  // CHATS
  const cl = [];
  const chats = facts.chats || [];
  const openChats = chats.filter((c) => c.status === "open").sort((a, b) => String(a.file).localeCompare(String(b.file)));
  const closedChats = chats.filter((c) => c.status === "closed").sort((a, b) => String(b.lastChange).localeCompare(String(a.lastChange)) || String(b.file).localeCompare(String(a.file)));
  cl.push(line("Open"));
  for (const c of openChats) {
    const stale = c.lastChange && now - new Date(c.lastChange) >= LIMITS.staleDays * 864e5;
    cl.push(line([c.name || c.file, c.subject, c.opened ? `opened ${shortChatDate(c.opened)}` : null].filter(Boolean).join(" · ") + (stale ? " stale?" : ""), 2));
  }
  if (!openChats.length) cl.push(line("none", 2));
  cl.push(line(`Closed (last ${LIMITS.closedChats})`));
  for (const c of closedChats.slice(0, LIMITS.closedChats)) {
    cl.push(line([c.finalName || c.name || c.file, c.closed ? `closed ${shortChatDate(c.closed)}` : "closed", c.outcome ? cut(c.outcome, 80) : null].filter(Boolean).join(" · "), 2));
  }
  if (!closedChats.length) cl.push(line("none", 2));
  sections.push({ title: "CHATS", lines: cl });

  const header = `STATUS · updated ${etTime(now)}`;
  const body = sections.map((s) => [s.title, ...s.lines.map((l) => "  ".repeat(l.indent) + l.text)].join("\n")).join("\n\n");
  const text = `${header}\n\n${body}\n`;
  // Keep BOARD.md small: shorten the cut lines if the board grows past the limit.
  if (Buffer.byteLength(text) > LIMITS.maxBytes && L.resultChars > 50) {
    return buildBoard(facts, { lengths: { resultChars: L.resultChars - 20, flagChars: L.flagChars - 15 } });
  }
  return { text, header, body, sections, updated: now.toISOString() };
}

/** The status page: the same sections, plain and light, readable on a phone. No scripts, no dependencies. */
function renderHtml(board) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const secs = board.sections.map((s) => `<section><h2>${esc(s.title)}</h2>\n${s.lines.map((l) =>
    `<div class="l i${l.indent}${l.mark ? " " + l.mark : ""}">${esc(l.text.replace(/^! /, "").replace(/^ {2}/, ""))}</div>`).join("\n")}\n</section>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flagfall status</title>
<style>
:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a65;--line:#e4e1d8;--ask:#a3361b}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:16px}
h1{font-size:18px;margin:0 0 4px}.upd{color:var(--muted);font-size:13px;margin-bottom:12px}
section{border-top:1px solid var(--line);padding:10px 0}
h2{font-size:12px;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}
.l{overflow-wrap:anywhere}.i1{padding-left:0}.i2{padding-left:16px}.i3{padding-left:32px}
.ask{color:var(--ask);font-weight:600}.ask::before{content:"! "}
</style></head>
<body><main>
<h1>Flagfall status</h1>
<div class="upd">${esc(board.header.replace(/^STATUS · /, "").replace(/^updated/, "Updated"))}</div>
${secs}
</main></body></html>
`;
}

/** board.json: the facts the page shows, plus a cache of which brief each closed pull request built. */
function boardJson(board, cache) {
  return { updated: board.updated, board: board.text, sections: board.sections, cache: cache || {} };
}

/** True when the new board says something different from the old one (the "updated" line aside). */
function changed(oldJson, newJson) {
  if (!oldJson) return true;
  const strip = (j) => JSON.stringify({ s: j.sections, c: j.cache });
  return strip(oldJson) !== strip(newJson);
}

// ---------- gathering (network) ----------

function gather(opts) {
  const repoDir = opts.repoDir || process.cwd();
  const repo = opts.repo || process.env.GITHUB_REPOSITORY || "productofdefiance/Flagfall";
  const sh = (cmd, args, o) => execFileSync(cmd, args, Object.assign({ cwd: repoDir, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] }, o));
  const git = (...args) => sh("git", args);
  const show = (ref, file) => { try { return git("show", `${ref}:${file}`); } catch (e) { return null; } };
  const ls = (ref, dir) => { try { return git("ls-tree", "--name-only", ref, `${dir}/`).split("\n").filter(Boolean); } catch (e) { return []; } };
  const api = (p, paginate) => JSON.parse(sh("gh", ["api", ...(paginate ? ["--paginate", "--slurp"] : []), `repos/${repo}/${p}`]));
  const NS = "refs/statusboard";

  // Pull requests (open ones, and every closed one for Merged).
  const allPrs = api("pulls?state=all&per_page=100", true).flat();
  const openPrs = allPrs.filter((p) => p.state === "open");

  // One fetch for every file the board reads.
  const specs = [`+refs/heads/main:${NS}/main`, `+refs/heads/brief/*:${NS}/brief/*`, ...openPrs.map((p) => `+refs/pull/${p.number}/head:${NS}/pr/${p.number}`)];
  git("fetch", "-q", "--no-tags", "origin", ...specs);
  let hasStatus = true;
  try { git("fetch", "-q", "--no-tags", "origin", `+refs/heads/status:${NS}/status`); } catch (e) { hasStatus = false; }
  const MAIN = `${NS}/main`;

  // main: game version, build, newest rule set, default brain.
  const vjs = show(MAIN, "board/version.js") || "";
  const main = { game: (/game:\s*"([^"]+)"/.exec(vjs) || [])[1], build: Number((/build:\s*(\d+)/.exec(vjs) || [])[1]) || null, rules: null, brain: null };
  try {
    const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "sb-"));
    fs.writeFileSync(path.join(tmp, "data.js"), show(MAIN, "board/data.js"));
    const D = require(path.join(tmp, "data.js"));
    main.rules = D.PRESETS[D.PRESETS.length - 1].id;
  } catch (e) { /* left blank, never guessed */ }
  // The default brain: the changelog's version table row for the game version on main.
  const cl = show(MAIN, "CHANGELOG.md") || "";
  const vrow = cl.split("\n").find((l) => main.game && l.startsWith(`| ${main.game} |`));
  if (vrow) main.brain = vrow.split("|").map((x) => x.trim())[3] || null;

  // Briefs on brief/NNN-* branches.
  const briefRefs = git("for-each-ref", "--format=%(refname)", `${NS}/brief/`).split("\n").filter(Boolean);
  const briefs = [];
  for (const ref of briefRefs) {
    const slug = ref.slice(`${NS}/brief/`.length);
    const m = /^(\d{3})-/.exec(slug);
    if (!m) continue;
    const file = ls(ref, "briefs").find((f) => path.basename(f).startsWith(`${m[1]}-`) && f.endsWith(".md"));
    const parsed = parseBrief(file ? show(ref, file) : "");
    const prev = briefs.find((b) => b.num === m[1]);
    if (prev) continue;  // two branches for one brief: keep the first
    briefs.push({ num: m[1], slug, waitsOn: file ? parsed.waitsOn : null, size: parsed.size });
  }

  // Closed pull requests: which brief each one built (title first; otherwise the brief file it added, cached).
  let old = null;
  if (hasStatus) { try { old = JSON.parse(show(`${NS}/status`, "board.json") || "null"); } catch (e) { old = null; } }
  const cache = Object.assign({}, (old && old.cache) || {});
  cache.prBrief = Object.assign({}, cache.prBrief || {});
  const addedBrief = (files) => { const f = files.find((x) => /^briefs\/\d{3}-.*\.md$/.test(x)); return f ? /briefs\/(\d{3})-/.exec(f)[1] : null; };

  const prs = [];
  for (const p of allPrs) {
    if (p.state !== "open" && !p.merged_at) continue;
    if (/^lab\//.test(p.head.ref)) continue;
    let brief = briefFromTitle(p.title);
    const rec = { number: p.number, title: p.title, state: p.state === "open" ? "open" : "merged", draft: !!p.draft, mergedAt: p.merged_at, brief: null };
    if (p.state === "open") {
      const head = `${NS}/pr/${p.number}`;
      let base = null;
      try { base = git("merge-base", MAIN, head).trim(); } catch (e) { base = null; }
      if (!brief && base) brief = addedBrief(git("diff", "--name-only", "--diff-filter=A", base, head, "--", "briefs/").split("\n").filter(Boolean));
      rec.brief = brief;
      if (brief) {
        const hv = show(head, "board/version.js") || "";
        rec.game = (/game:\s*"([^"]+)"/.exec(hv) || [])[1] || null;
        const bf = ls(head, "briefs").find((f) => path.basename(f).startsWith(`${brief}-`));
        rec.size = (briefs.find((b) => b.num === brief) || {}).size || (bf ? parseBrief(show(head, bf)).size : null);
        // Checks: the required `checks` job on the head commit.
        try {
          const runs = api(`commits/${p.head.sha}/check-runs?per_page=100`).check_runs || [];
          const c = runs.filter((r) => r.name === "checks").sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0];
          rec.checks = !c ? (runs.some((r) => r.status !== "completed") ? "running" : "none")
            : c.status !== "completed" ? "running" : c.conclusion === "success" ? "pass" : "fail";
        } catch (e) { rec.checks = "unknown"; }
        const labels = (p.labels || []).map((l) => l.name);
        rec.review = labels.includes("review: hold") ? "hold" : labels.includes("review: merge") ? "merge" : null;
      }
      rec.base = base;
    } else {
      if (!brief) {
        const k = String(p.number);
        if (!(k in cache.prBrief)) {
          try { cache.prBrief[k] = addedBrief(api(`pulls/${p.number}/files?per_page=100`, true).flat().filter((f) => f.status === "added").map((f) => f.filename)); }
          catch (e) { cache.prBrief[k] = null; }
        }
        brief = cache.prBrief[k];
      }
      rec.brief = brief;
    }
    prs.push(rec);
  }

  // Flags: main, plus every row an open pull request added or changed (rows it only carries from an older main are
  // left out, so a pull request that is behind main can't bring back a row main has since closed).
  const flagFiles = (ref) => ["FLAGS.md", ...ls(ref, "flags").filter((f) => /\.md$/.test(f) && !/README\.md$/i.test(f))];
  const rowsAt = (ref) => flagFiles(ref).flatMap((f) => parseFlags(show(ref, f) || ""));
  const flags = rowsAt(MAIN).map((r) => Object.assign(r, { fromPr: false }));
  const results = [];
  const csvRows = (ref) => parseCsv(show(ref, "results/index.csv") || "");
  results.push(...csvRows(MAIN));
  for (const p of openPrs) {
    const head = `${NS}/pr/${p.number}`;
    if (/^lab\//.test(p.head.ref)) { results.push(...csvRows(head)); continue; }
    const rec = prs.find((x) => x.number === p.number);
    const base = rec && rec.base;
    const baseRows = base ? rowsAt(base) : [];
    const baseRaw = new Set(baseRows.map((r) => r.raw)), baseNames = new Set(baseRows.map((r) => r.name));
    for (const r of rowsAt(head)) if (!baseRaw.has(r.raw)) flags.push(Object.assign(r, { fromPr: true, pr: p.number, added: !baseNames.has(r.name) }));
  }

  // The last night-checks run on main.
  let nightly = null;
  try {
    const runs = (api("actions/workflows/night-checks.yml/runs?branch=main&per_page=20").workflow_runs || []).filter((r) => r.event !== "pull_request");
    const r = runs.find((x) => x.status === "completed") || runs[0];
    if (r) nightly = { conclusion: r.status !== "completed" ? "running" : r.conclusion === "success" ? "pass" : r.conclusion === "failure" ? "fail" : r.conclusion, time: r.run_started_at || r.created_at };
  } catch (e) { nightly = null; }

  // The chat log, on the status branch.
  const chats = [];
  if (hasStatus) {
    for (const f of ls(`${NS}/status`, "chats")) {
      if (!/\.md$/.test(f) || /README\.md$/i.test(f)) continue;
      const c = parseChat(show(`${NS}/status`, f));
      let lastChange = null;
      try { lastChange = git("log", "-1", "--format=%cI", `${NS}/status`, "--", f).trim() || null; } catch (e) { lastChange = null; }
      chats.push(Object.assign({ file: path.basename(f), lastChange }, c));
    }
  }

  for (const p of prs) delete p.base;
  return { facts: { now: (opts.now || new Date()).toISOString(), main, nightly, results, flags, briefs, prs, chats }, cache, old };
}

/** Write a file through a temp file and a rename, so a failed run never leaves half a file. */
function writeAtomic(file, content) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

function main() {
  const out = process.argv[2] || "status-out";
  const t0 = Date.now();
  const { facts, cache, old } = gather({});
  const board = buildBoard(facts);
  const json = boardJson(board, cache);
  // Everything is worked out before anything is written.
  const html = renderHtml(board);
  fs.mkdirSync(out, { recursive: true });
  writeAtomic(path.join(out, "BOARD.md"), board.text);
  writeAtomic(path.join(out, "board.json"), JSON.stringify(json, null, 1) + "\n");
  writeAtomic(path.join(out, "index.html"), html);
  process.stderr.write(board.text + `\n(${Buffer.byteLength(board.text)} bytes, ${((Date.now() - t0) / 1000).toFixed(1)} s)\n`);
  process.stdout.write(`changed=${changed(old, json)}\n`);
}

module.exports = { buildBoard, renderHtml, boardJson, changed, parseFlags, parseBrief, parseCsv, parseChat, briefFromTitle, nameFromTitle, cut, etTime, LIMITS };
if (require.main === module) main();
