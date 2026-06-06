#!/bin/bash
# Script to sync documentation updates from repositories

set -e

echo "🔄 Syncing documentation updates..."
echo ""

# Run the copy script
bash "$(dirname "$0")/copy-docs.sh"

echo ""
echo "✅ Documentation synced!"
echo "Rebuild Docusaurus to see changes: cd docusaurus && npm run build"
