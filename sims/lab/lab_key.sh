#!/usr/bin/env bash
# Brief 027 (F024-2): which token is GH_TOKEN? Sourced by deliver.sh and refresh.sh.
# The Editor's key (LAB_TOKEN, a personal fine-grained key) can read GET /user; the workflow's own token can't (GitHub
# answers 403 "Resource not accessible by integration"), and an expired or revoked key gets 401. So:
#   lab_key_in_use  -> true only when the personal key is in use and still works.
# With the key, a push or a pull request the script makes starts the pull request's own `checks` run, so the script
# must not start a second one. Without it (no key, or an expired one), nothing starts by itself: the script starts the
# checks, as before Brief 027.
lab_key_in_use() { gh api user --silent >/dev/null 2>&1; }

# Start checks.yml on a branch only when nothing else will (the workflow token is in use).
start_checks_unless_key() {
  local ref="$1"
  if lab_key_in_use; then
    echo "The lab's key is in use: the pull request's own checks run is the one that counts (no second run started)."
  else
    gh workflow run checks.yml --ref "$ref" || echo "::warning::Could not start the checks on $ref; push any commit to start them."
  fi
}
