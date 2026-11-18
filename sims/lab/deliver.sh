#!/usr/bin/env bash
# The lab's delivery (Brief 008): gets new results to where they belong. Only results/ and studies/ may change.
#   bash sims/lab/deliver.sh main "<title>"        an automatic pull request into main that merges itself once the
#                                                   checks pass (checks.yml is started on it, since a pull request
#                                                   opened by the workflow's own token doesn't start workflows)
#   bash sims/lab/deliver.sh branch "<title>" <b>  a commit on pull request branch <b> (then checks.yml on it)
# Needs GH_TOKEN (the workflow token, or LAB_TOKEN if the Editor added one) and git set up to push.
set -euo pipefail
mode="$1"; title="$2"; target="${3:-}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A results studies
if git diff --cached --quiet; then echo "Nothing new in results/ or studies/: nothing to deliver."; exit 0; fi
bad=$(git diff --cached --name-only | grep -v -E '^(results|studies)/' || true)
if [ -n "$bad" ]; then echo "Refusing to deliver: these changes are outside results/ and studies/:"; echo "$bad"; exit 1; fi
if [ "$mode" = "branch" ]; then
  git commit -q -m "$title"
  git push origin "HEAD:$target"
  gh workflow run checks.yml --ref "$target" || echo "::warning::Could not start the checks on $target; push any commit to start them."
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
gh workflow run checks.yml --ref "$branch" || echo "::warning::Could not start the checks on $branch."
