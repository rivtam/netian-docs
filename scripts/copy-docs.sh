#!/bin/bash
# Script to copy documentation from all repositories

set -e

echo "📚 Copying documentation from repositories..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCS_PORTAL_DIR="$(dirname "$SCRIPT_DIR")"
DOCUSAURUS_DOCS_DIR="$DOCS_PORTAL_DIR/docusaurus/docs"

# Source repositories (adjust paths as needed)
INFRA_REPO="../macmini-infrastructure"
EDUHUB_REPO="../../eduhub"  # Adjust path to your eduhub repo
BLOG_REPO="../../blog"       # Adjust path to your blog repo

# Create target directories
mkdir -p "$DOCUSAURUS_DOCS_DIR/infrastructure"
mkdir -p "$DOCUSAURUS_DOCS_DIR/eduhub"
mkdir -p "$DOCUSAURUS_DOCS_DIR/blog"
mkdir -p "$DOCUSAURUS_DOCS_DIR/general"

# Function to copy docs from a repo
copy_repo_docs() {
    local repo_path=$1
    local target_dir=$2
    local repo_name=$3

    if [ -d "$repo_path" ]; then
        echo "📖 Copying docs from $repo_name..."

        # Copy all markdown files from root
        if ls "$repo_path"/*.md 1> /dev/null 2>&1; then
            cp "$repo_path"/*.md "$target_dir/"
            echo "   ✅ Copied root markdown files"
        fi

        # Copy docs directory if it exists
        if [ -d "$repo_path/docs" ]; then
            cp -r "$repo_path/docs"/* "$target_dir/" 2>/dev/null || true
            echo "   ✅ Copied docs directory"
        fi

        # Copy service-specific READMEs if they exist
        for service_dir in "$repo_path"/*/; do
            if [ -f "$service_dir/README.md" ]; then
                service_name=$(basename "$service_dir")
                mkdir -p "$target_dir/$service_name"
                cp "$service_dir/README.md" "$target_dir/$service_name/"
                echo "   ✅ Copied $service_name/README.md"
            fi
        done

        echo ""
    else
        echo "⚠️  Repository not found: $repo_path"
        echo "   Skipping $repo_name docs"
        echo ""
    fi
}

# Copy from each repository
copy_repo_docs "$INFRA_REPO" "$DOCUSAURUS_DOCS_DIR/infrastructure" "Infrastructure"
copy_repo_docs "$EDUHUB_REPO" "$DOCUSAURUS_DOCS_DIR/eduhub" "EduHub"
copy_repo_docs "$BLOG_REPO" "$DOCUSAURUS_DOCS_DIR/blog" "Blog"

# Create general docs (custom documentation)
cat > "$DOCUSAURUS_DOCS_DIR/general/welcome.md" << 'EOF'
---
sidebar_position: 1
---

# Welcome to the Documentation Portal

Welcome to the centralized documentation portal for all our projects and infrastructure.

## What's Here

This portal contains documentation for:

- **Infrastructure**: Mac Mini server setup, nginx, databases, monitoring
- **EduHub**: EduHub application documentation
- **Blog**: Blog application documentation
- **General**: Company-wide documentation and guides

## Getting Started

Use the sidebar to navigate through different sections based on your role and access level.

## Need Help?

Contact your administrator if you need access to additional documentation or have questions.
EOF

echo "✅ Documentation copied successfully!"
echo ""
echo "Target location: $DOCUSAURUS_DOCS_DIR"
echo ""
echo "Next steps:"
echo "1. cd docusaurus"
echo "2. npm install"
echo "3. npm start"
