#!/usr/bin/env bash
# The lab's delivery (Brief 008): gets new results to where they belong. Only results/ and studies/ may change.
#   bash sims/lab/deliver.sh main "<title>"        an automatic pull request into main that merges itself once the
#                                                   checks pass
#   bash sims/lab/deliver.sh branch "<title>" <b>  a commit on pull request branch <b>
# Brief 027 (F024-2): with the Editor's key (LAB_TOKEN) the pull request's own checks run is the only one; with the
# workflow's own token (no key, or an expired one) nothing starts by itself, so checks.yml is started from here
# (lab_key.sh says how the two are told apart).
# Needs GH_TOKEN (the workflow token, or LAB_TOKEN if the Editor added one) and git set up to push.
set -euo pipefail
. "$(dirname "$0")/lab_key.sh"
mode="$1"; title="$2"; target="${3:-}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A results studies
# Brief 031 (amendment 3, H1): a build's branch never carries the results index; main's is rebuilt by the next results
# pull request (merge.js and index.js --rebuild), so two builds with lab results can't collide in it.
if [ "$mode" = "branch" ]; then git reset -q -- results/INDEX.md results/index.csv 2>/dev/null || true; git checkout -q -- results/INDEX.md results/index.csv 2>/dev/null || true; fi
if git diff --cached --quiet; then echo "Nothing new in results/ or studies/: nothing to deliver."; exit 0; fi
bad=$(git diff --cached --name-only | grep -v -E '^(results|studies)/' || true)
if [ -n "$bad" ]; then echo "Refusing to deliver: these changes are outside results/ and studies/:"; echo "$bad"; exit 1; fi
if [ "$mode" = "branch" ]; then
  git commit -q -m "$title"
  git push origin "HEAD:$target"
  start_checks_unless_key "$target"
  exit 0
fi
branch="lab/$(date -u +%Y%m%d-%H%M%S)-${GITHUB_RUN_ID:-local}"
git checkout -q -b "$branch"
git commit -q -m "$title"
git push -q origin "$branch"
body="Results from the lab (\`.github/workflows/lab.yml\`), run ${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}.

Changes only \`results/\` and \`studies/\`. It merges itself once the checks pass (Brief 008)."
url=$(gh pr create --base main --head "$branch" --title "$title" --body "$body")
echo "Pull request: $url"
gh pr merge "$url" --auto --squash --delete-branch || echo "::warning::Auto-merge isn't available: turn on Settings → General → Allow auto-merge (FLAGS.md). The pull request waits for a click."
start_checks_unless_key "$branch"
