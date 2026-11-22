#!/usr/bin/env node
/* Brief 027 (F024-2): the delivery and the refresh start checks.yml themselves only when the workflow's own token is in
 * use. With the Editor's key (LAB_TOKEN) the pull request's own checks run is the only one.
 * Runs deliver.sh for real against a local git remote, with a stand-in `gh` that records what it was asked to do and
 * answers `gh api user` as the key (works) or the workflow token (refused). No network.
 * Run: node sims/lab/test_deliver.js */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const LAB = __dirname;
let fails = 0;
const ok = (cond, name) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) fails++; };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "deliver-"));
const bin = path.join(tmp, "bin");
fs.mkdirSync(bin);
// The stand-in gh: logs every call; `api user` succeeds only when STUB_KEY=1 (the key); `pr create` prints a URL.
fs.writeFileSync(path.join(bin, "gh"), `#!/usr/bin/env bash
echo "$*" >> "$GH_LOG"
case "$1 $2" in
  "api user") [ "$STUB_KEY" = 1 ] && exit 0 || { echo "Resource not accessible by integration" >&2; exit 1; } ;;
  "pr create") echo "https://example.invalid/pull/1" ;;
esac
exit 0
`, { mode: 0o755 });

const sh = (args, cwd, env) => execFileSync(args[0], args.slice(1), { cwd, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] }).toString();

function run(mode, key) {
  const dir = fs.mkdtempSync(path.join(tmp, `${mode}-${key}-`));
  const remote = path.join(dir, "remote.git");
  const work = path.join(dir, "work");
  sh(["git", "init", "-q", "--bare", remote], dir);
  sh(["git", "init", "-q", "-b", "main", work], dir);
  fs.mkdirSync(path.join(work, "studies"));
  fs.writeFileSync(path.join(work, "studies", "README.md"), "job orders\n");
  sh(["git", "add", "-A"], work);
  sh(["git", "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "start"], work);
  sh(["git", "remote", "add", "origin", remote], work);
  sh(["git", "push", "-q", "origin", "main", "main:build-branch"], work);
  fs.mkdirSync(path.join(work, "results"));
  fs.writeFileSync(path.join(work, "results", "new.txt"), "a result\n");
  const log = path.join(dir, "gh.log");
  fs.writeFileSync(log, "");
  const env = { PATH: `${bin}:${process.env.PATH}`, GH_LOG: log, STUB_KEY: key ? "1" : "0", GITHUB_RUN_ID: "7" };
  const args = mode === "main" ? ["bash", path.join(LAB, "deliver.sh"), "main", "Lab results"] : ["bash", path.join(LAB, "deliver.sh"), "branch", "Lab results", "build-branch"];
  const out = sh(args, work, env);
  return { calls: fs.readFileSync(log, "utf8").split("\n").filter(Boolean), out, remote };
}

for (const mode of ["main", "branch"]) {
  const withKey = run(mode, true);
  const noKey = run(mode, false);
  const started = (r) => r.calls.some((c) => /^workflow run checks\.yml/.test(c));
  ok(!started(withKey), `${mode}: with the key, the delivery starts no second checks run`);
  ok(/pull request's own checks run is the one that counts/.test(withKey.out), `${mode}: with the key, it says why`);
  ok(started(noKey), `${mode}: with the workflow token (no key, or an expired one), it still starts checks.yml as before`);
  const ref = mode === "main" ? /^workflow run checks\.yml --ref lab\/\d{8}-\d{6}-7$/ : /^workflow run checks\.yml --ref build-branch$/;
  ok(noKey.calls.some((c) => ref.test(c)), `${mode}: without the key, the checks start on the right branch`);
  if (mode === "main") {
    ok(withKey.calls.some((c) => /^pr create/.test(c)) && withKey.calls.some((c) => /^pr merge .* --auto/.test(c)), "main: the results pull request still opens with auto-merge on (key)");
    ok(noKey.calls.some((c) => /^pr merge .* --auto/.test(c)), "main: the results pull request still opens with auto-merge on (no key)");
  } else {
    const head = sh(["git", "--git-dir", withKey.remote, "log", "-1", "--format=%s", "build-branch"], tmp).trim();
    ok(head === "Lab results", "branch: the results commit still lands on the pull request's branch");
  }
}

// The refresh uses the same switch and never starts the checks any other way.
const refresh = fs.readFileSync(path.join(LAB, "refresh.sh"), "utf8");
ok(/lab_key\.sh/.test(refresh) && /start_checks_unless_key "\$branch"/.test(refresh), "refresh: restarts the checks through the same key switch");
ok(!/gh workflow run/.test(refresh) && !/gh workflow run/.test(fs.readFileSync(path.join(LAB, "deliver.sh"), "utf8")), "deliver and refresh: no direct 'gh workflow run' left");

fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll delivery checks passed.");
process.exit(fails ? 1 : 0);
