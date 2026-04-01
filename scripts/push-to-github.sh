#!/bin/bash

# Push Replit code to GitHub
# Usage: bash scripts/push-to-github.sh "Your commit message"

set -e

COMMIT_MSG="${1:-Update from Replit}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN secret is not set."
  echo "Add it in Replit Secrets with a GitHub Personal Access Token (repo scope)."
  exit 1
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
  echo "ERROR: No 'origin' remote found."
  echo "Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
  exit 1
fi

# Inject token into the remote URL
AUTHED_URL=$(echo "$REMOTE_URL" | sed "s|https://|https://$GITHUB_TOKEN@|")

echo "Adding all changes..."
git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit — working tree is clean."
  exit 0
fi

echo "Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo "Pushing to GitHub..."
git push "$AUTHED_URL" HEAD:main

echo ""
echo "Done! Code pushed to GitHub successfully."
