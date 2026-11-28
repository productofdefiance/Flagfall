// @test job=rules quick=yes release=yes night=no
/* Checks for the status page (Brief 023), no network: the page's own script is run in a sandbox with a fake fetch,
   a fake clock and a fake local storage. Called from test_board.js; also runs alone: node sims/status/test_page.js */
"use strict";
const vm = require("vm");

const TOKEN_LIKE = /\b(github_pat_|ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{10,}/;

function fakeStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}
/** A fake fetch: records every call; boards[i] is what the i-th read returns (the last one repeats). */
function fakeFetch(opts) {
  const calls = [];
  let reads = 0;
  const fn = (url, init) => {
    calls.push({ url: String(url), method: (init && init.method) || "GET", headers: (init && init.headers) || {} });
    if (/\/dispatches$/.test(url)) return Promise.resolve({ ok: opts.dispatchStatus === 204, status: opts.dispatchStatus || 204, json: () => Promise.resolve({}) });
    const b = opts.boards[Math.min(reads++, opts.boards.length - 1)];
    return Promise.resolve({ ok: !!b, status: b ? 200 : 404, json: () => Promise.resolve(b) });
  };
  fn.calls = calls;
  return fn;
}

async function run(check, B, board, json) {
  const html = B.renderHtml(board, json);
  const script = html.split("<script>")[1].split("</script>")[0];
  // The page's own script, loaded the way a browser would, minus the screen.
  const ctx = { Promise, setTimeout, JSON, Date, Math, String, Number, Object, Array, RegExp, Error };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(script.replace(/\}\)\(this\);\s*$/, "})(self);"), ctx);
  const P = ctx.FlagfallStatus;
  check("the page's script loads and exposes its parts", !!(P && P.refresh && P.renderApp));

  check("no key in the page source or board.json", !TOKEN_LIKE.test(html) && !TOKEN_LIKE.test(JSON.stringify(json)) && !/"(key|token)"\s*:/i.test(JSON.stringify(json)));
  check("the page keeps its key only in this browser's local storage", (html.match(/setItem\(/g) || []).length === 1 && html.includes("storage.setItem(KEY_NAME"));

  // A fake clock: wait() moves time on at once.
  const clock = () => { let t = 1e12; return { now: () => t, wait: (ms) => { t += ms; return Promise.resolve(); } }; };
  const older = { updated: "2026-11-20T08:00:00.000Z" }, shownB = { updated: "2026-11-20T08:40:00.000Z" }, newerB = { updated: "2026-11-20T08:43:00.000Z" };
  const env = (f, storage, c, onBoard) => {
    const seen = { button: [], note: [], boards: [] };
    let shown = shownB.updated;
    return { seen, env: { fetch: f, storage, now: c.now, wait: c.wait, shown: () => shown,
      onBoard: (j) => { seen.boards.push(j.updated); shown = j.updated; if (onBoard) onBoard(j); },
      onButton: (b) => seen.button.push(b), onNote: (n) => seen.note.push(n) } };
  };

  // Without a key: re-read only, never start a workflow.
  let f = fakeFetch({ boards: [newerB] });
  let e = env(f, fakeStorage(), clock());
  let out = await P.refresh(e.env);
  check("Refresh without a key makes no call to start a workflow", out === "read" && !f.calls.some((c) => c.method === "POST" || /dispatches/.test(c.url)), JSON.stringify(f.calls));
  check("Refresh without a key re-reads and redraws a newer board", e.seen.boards.length === 1 && e.seen.boards[0] === newerB.updated);
  check("re-reading sends no key when none is saved", !f.calls.some((c) => c.headers && c.headers.Authorization));

  // Never an older board than the one on screen.
  f = fakeFetch({ boards: [older] });
  e = env(f, fakeStorage(), clock());
  await P.refresh(e.env);
  check("an older board is never drawn over a newer one", e.seen.boards.length === 0);

  // With a key: one dispatch per tap, then polls until a newer board arrives.
  const KEY = "test-key-not-a-real-token";
  f = fakeFetch({ boards: [shownB, shownB, newerB] });
  e = env(f, fakeStorage({ [P.KEY_NAME]: KEY }), clock());
  out = await P.refresh(e.env);
  const disp = f.calls.filter((c) => /\/actions\/workflows\/status-board\.yml\/dispatches$/.test(c.url));
  check("with a key, one tap calls the dispatch endpoint once", disp.length === 1 && disp[0].method === "POST" && disp[0].headers.Authorization === `Bearer ${KEY}`, JSON.stringify(f.calls.map((c) => c.method + " " + c.url)));
  check("with a key, the button says Rebuilding… then the new board is drawn", out === "rebuilt" && e.seen.button[0] === "Rebuilding…" && e.seen.boards[0] === newerB.updated && e.seen.button[e.seen.button.length - 1] === null);
  check("with a key, it checks every 10 seconds", f.calls.filter((c) => c.method === "GET").length === 3 && P.POLL_MS === 10000);

  // A second tap is a second dispatch (one per tap).
  f = fakeFetch({ boards: [newerB] });
  e = env(f, fakeStorage({ [P.KEY_NAME]: KEY }), clock());
  await P.refresh(e.env); await P.refresh(e.env);
  check("two taps, two dispatch calls", f.calls.filter((c) => /dispatches$/.test(c.url)).length === 2);

  // Nothing newer within 3 minutes.
  f = fakeFetch({ boards: [shownB] });
  const c3 = clock(), t0 = c3.now();
  e = env(f, fakeStorage({ [P.KEY_NAME]: KEY }), c3);
  out = await P.refresh(e.env);
  check("no new board within 3 minutes: 'Still building. Try again in a minute.'", out === "timeout" && e.seen.note.includes("Still building. Try again in a minute.") && c3.now() - t0 >= 180000 && c3.now() - t0 <= 190000);

  // A wrong or expired key: say so, and fall back to re-reading without it.
  f = fakeFetch({ boards: [newerB], dispatchStatus: 401 });
  e = env(f, fakeStorage({ [P.KEY_NAME]: KEY }), clock());
  out = await P.refresh(e.env);
  const after = f.calls.slice(1);
  check("a wrong key says so and falls back to re-reading", out === "badkey" && e.seen.note.some((n) => /didn't work/.test(n)) && e.seen.boards[0] === newerB.updated && after.length >= 1 && after.every((c) => !c.headers.Authorization));

  // Saving and removing the key.
  const s = fakeStorage();
  P.setKey(s, "abc"); const had = P.getKey(s) === "abc"; P.setKey(s, "");
  check("Save keeps the key, Remove forgets it", had && P.getKey(s) === "" && s._m.size === 0);
  check("a storage that throws reads as no key", P.getKey({ getItem: () => { throw new Error("blocked"); } }) === "");
}

module.exports = { run };
if (require.main === module) {
  // Alone: build the fixture through test_board.js instead (it calls run()).
  require("./test_board.js");
}
