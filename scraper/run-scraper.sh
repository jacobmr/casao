#!/bin/bash
# Guesty Scraper v2 — runs on 636desk
# Cron: 0 12 * * * /data/dev/CasaVistas/scraper/run-scraper.sh >> /data/dev/CasaVistas/scraper/scraper.log 2>&1

cd /data/dev/CasaVistas/scraper
echo "=== $(date -Is) ==="
node scrape-to-gcal.js
echo ""
