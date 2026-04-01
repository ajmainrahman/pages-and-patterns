#!/bin/bash

# Push Replit code to GitHub
# Usage: bash scripts/push-to-github.sh "Your commit message"
# To push to a NEW repo: bash scripts/push-to-github.sh "message" https://github.com/USER/NEW_REPO.git

set -e

COMMIT_MSG="${1:-Update from Replit}"
NEW_REMOTE="${2:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN secret is not set."
  exit 1
fi

# If a new remote URL was provided, update origin
if [ -n "$NEW_REMOTE" ]; then
  echo "Setting remote origin to: $NEW_REMOTE"
  git remote set-url origin "$NEW_REMOTE" 2>/dev/null || git remote add origin "$NEW_REMOTE"
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
  echo "ERROR: No 'origin' remote found."
  echo "Run: bash scripts/push-to-github.sh \"message\" https://github.com/USER/REPO.git"
  exit 1
fi

echo "Pushing to: $REMOTE_URL"

# Remove any stale lock files
rm -f .git/index.lock

# Stage all changes
git add -A

# Commit if there's anything new
if git diff --cached --quiet; then
  echo "Nothing new to commit — pushing existing commits."
else
  echo "Committing: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

# Inject token into the remote URL for auth
AUTHED_URL=$(echo "$REMOTE_URL" | sed "s|https://|https://$GITHUB_TOKEN@|")

echo "Pushing to GitHub..."
git push "$AUTHED_URL" HEAD:main --force

echo ""
echo "Done! Code is now on GitHub."
