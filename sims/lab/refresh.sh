#!/usr/bin/env bash
# Results refresh (Brief 016, F35), run by .github/workflows/results-refresh.yml.
# For every open pull request from a lab/* branch: merge main into it. If the only conflicts are results/INDEX.md and
# results/index.csv, rebuild both from the run folders (sims/lab/index.js --rebuild), commit, push, restart its checks and
# keep auto-merge on. Any other conflict, or a change outside results/ and studies/: leave it and warn.
# Needs GH_TOKEN and a full clone (fetch-depth 0).
set -euo pipefail
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git fetch -q origin main
prs=$(gh pr list --repo "$GITHUB_REPOSITORY" --state open --json number,headRefName --jq '.[] | select(.headRefName | startswith("lab/")) | "\(.number) \(.headRefName)"')
[ -z "$prs" ] && { echo "No open results pull requests."; exit 0; }
while read -r num branch; do
  echo "== #$num ($branch)"
  git fetch -q origin "$branch"
  git checkout -q -B "$branch" "origin/$branch"
  if git merge-base --is-ancestor origin/main HEAD; then echo "up to date with main"; continue; fi
  if git merge -q --no-edit origin/main >/dev/null 2>&1; then
    # merged without a conflict: GitHub can merge it too, so leave it as it is (no push, no rerun of the checks)
    git merge --abort 2>/dev/null || git reset -q --hard "origin/$branch"
    echo "behind main but no conflict: left as it is"; continue
  fi
  conflicts=$(git diff --name-only --diff-filter=U)
  others=$(echo "$conflicts" | grep -v -E '^results/(INDEX\.md|index\.csv)$' || true)
  if [ -n "$others" ]; then
    echo "::warning::#$num conflicts outside the index files; left for a person: $others"
    git merge --abort; continue
  fi
  git checkout -q --theirs results/INDEX.md results/index.csv
  node sims/lab/index.js --rebuild results
  git add results/INDEX.md results/index.csv
  outside=$(git diff --cached --name-only origin/main | grep -v -E '^(results|studies)/' || true)
  if [ -n "$outside" ]; then
    echo "::warning::#$num would differ from main outside results/ and studies/; left for a person: $outside"
    git merge --abort; continue
  fi
  git commit -q -m "Merge main into lab results; index rebuilt from the run folders (Brief 016)"
  git push -q origin "HEAD:$branch"
  gh workflow run checks.yml --ref "$branch" || echo "::warning::Could not start the checks on $branch."
  gh pr merge "$num" --auto --squash --delete-branch || echo "::warning::Could not turn on auto-merge for #$num."
  echo "refreshed #$num"
done <<< "$prs"
