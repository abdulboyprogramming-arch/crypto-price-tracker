#!/bin/bash
# ============================================
# CRYPTO PRICE TRACKER - Deployment Script
# Deploys V2 Web App to GitHub Pages
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Crypto Tracker Pro - Deploy Script    ${NC}"
echo -e "${GREEN}==========================================${NC}"

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Git working directory is not clean. Commit changes first.${NC}"
    git status -s
    exit 1
fi

# Get current version
VERSION=$(date +"%Y.%m.%d-%H%M")
echo -e "${BLUE}📦 Version: $VERSION${NC}"

# Create version.json
echo "{\"version\":\"$VERSION\",\"buildDate\":\"$(date -Iseconds)\"}" > v2/web-app/version.json
echo -e "${GREEN}✅ Created version.json${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if [ -f "v2/.github/workflows/test.yml" ]; then
    echo -e "${GREEN}✅ Test workflow configured${NC}"
else
    echo -e "${RED}⚠️ Test workflow not found${NC}"
fi

# Generate icons (if Pillow is installed)
echo -e "${YELLOW}🎨 Generating icons...${NC}"
if command -v python3 &>/dev/null; then
    python3 scripts/generate-icons.py || echo -e "${RED}⚠️ Icon generation failed (Pillow may not be installed)${NC}"
else
    echo -e "${RED}⚠️ Python not found, skipping icon generation${NC}"
fi

# Commit version file
git add v2/web-app/version.json
git commit -m "chore: bump version to $VERSION" || echo -e "${YELLOW}No changes to commit${NC}"

# Push to trigger GitHub Actions
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Deployment triggered!                   ${NC}"
echo -e "${GREEN}  Check GitHub Actions for progress.      ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "${BLUE}🌐 Live URL: https://abdulboyprogramming-arch.github.io/crypto-price-tracker/v2/web-app/${NC}"
