#!/bin/bash
# Kindred → Guesty Sync — runs on 636desk
# Cron: 30 12 * * * /data/dev/CasaVistas/scraper/run-kindred-sync.sh >> /data/dev/CasaVistas/scraper/kindred-sync.log 2>&1

cd /data/dev/CasaVistas/scraper
echo "=== $(date -Is) ==="
node kindred-to-guesty.js
echo ""
