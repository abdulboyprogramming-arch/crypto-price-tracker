#!/bin/bash
# ============================================
# CRYPTO PRICE TRACKER - Backup Script
# Creates a timestamped backup of the project
# ============================================

set -e

# Configuration
BACKUP_DIR="$HOME/crypto-tracker-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="crypto-tracker-backup-${TIMESTAMP}.tar.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Crypto Tracker Pro - Backup Script   ${NC}"
echo -e "${GREEN}==========================================${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude="*.db" \
    --exclude="*.pyc" \
    --exclude="__pycache__" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="*.tar.gz" \
    . 2>/dev/null || true

if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    echo -e "${GREEN}✅ Backup created: $BACKUP_NAME ($SIZE)${NC}"
    echo -e "${GREEN}   Location: $BACKUP_DIR/${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Clean old backups (keep last 10)
echo -e "${YELLOW}Cleaning old backups...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
echo -e "${GREEN}✅ Old backups cleaned${NC}"

cd -
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Backup Complete!                       ${NC}"
echo -e "${GREEN}==========================================${NC}"
