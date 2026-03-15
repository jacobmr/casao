#!/bin/bash
# scraper-poller.sh — Polls Vercel KV flag and runs Guesty scraper on demand
# Install: */5 * * * * /home/jacob/scraper-poller.sh >> /home/jacob/scraper-poller.log 2>&1
#
# Requires: SCRAPER_SECRET env var (set in ~/scraper-poller.env)
# Reads flag from: https://www.casavistas.net/api/family/admin/scraper

# Load secret from env file
if [ -f ~/scraper-poller.env ]; then
  source ~/scraper-poller.env
fi

if [ -z "$SCRAPER_SECRET" ]; then
  echo "$(date): ERROR - SCRAPER_SECRET not set"
  exit 1
fi

API_URL="https://www.casavistas.net/api/family/admin/scraper"

# Check if trigger is pending
STATUS=$(curl -sf -H "Authorization: Bearer $SCRAPER_SECRET" "$API_URL")
if [ $? -ne 0 ]; then
  echo "$(date): ERROR - Failed to reach API"
  exit 1
fi

PENDING=$(echo "$STATUS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('pending',False))" 2>/dev/null)

if [ "$PENDING" != "True" ]; then
  # No trigger pending — silent exit
  exit 0
fi

echo "$(date): Trigger detected, running scraper..."

# Run the Guesty scraper
~/run-guesty-scraper.sh

# Count reservations from scraper log (last line with "upcoming")
COUNT=$(grep -oP '\d+ upcoming' ~/guesty-scraper.log | tail -1 | grep -oP '\d+')

# Refresh availability cache for next 6 months
echo "$(date): Refreshing availability cache..."
for i in $(seq 0 5); do
  M=$(date -d "+${i} months" +%Y-%m-01)
  E=$(date -d "+$((i+1)) months" +%Y-%m-01)
  curl -s "https://www.casavistas.net/api/calendar?from=$M&to=$E&skipCache=true" > /dev/null
done

# Report completion
curl -sf -X POST \
  -H "Authorization: Bearer $SCRAPER_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"complete\",\"result\":\"success\",\"reservations\":${COUNT:-0}}" \
  "$API_URL"

echo "$(date): Scraper complete, cache refreshed (${COUNT:-0} reservations)"
