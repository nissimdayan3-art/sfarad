#!/usr/bin/env bash
# Deploy the whole project from Google Cloud Shell (runs in the browser).
#   bash deploy.sh            -> full deploy (hosting + functions + rules)
#   bash deploy.sh hosting    -> website files only (fast, no functions)
set -e
cd "$(dirname "$0")"
PROJECT="sepharad-fe9e8"
export FUNCTIONS_DISCOVERY_TIMEOUT=120

if [ "$1" = "hosting" ]; then
  echo ">> Deploying hosting only..."
  firebase deploy --only hosting --project "$PROJECT"
  exit 0
fi

echo ">> Installing functions dependencies..."
(cd functions && npm install --no-audit --no-fund)

echo ">> Checking the mailbox password secret (SMTP_PASS)..."
if ! firebase functions:secrets:get SMTP_PASS --project "$PROJECT" >/dev/null 2>&1; then
  echo "   SMTP_PASS is not set yet. Paste the mailbox password when asked (it is hidden and stored in Secret Manager, not in the code)."
  firebase functions:secrets:set SMTP_PASS --project "$PROJECT"
fi

echo ">> Deploying everything..."
firebase deploy --project "$PROJECT"
echo ">> Done."
