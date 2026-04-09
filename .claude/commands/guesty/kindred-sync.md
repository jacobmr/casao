# /kindred:sync - Run Kindred → Guesty Sync

Trigger the Kindred home exchange sync that creates Guesty owner blocks from `[KINDRED]` calendar events.

## What it does

The sync script (`kindred-to-guesty.js`) reads future `[KINDRED]` events from Google Calendar, creates owner reservations in Guesty to block those dates, and marks synced events with `[SYNCED-TO-GUESTY]` in their description.

## Steps

1. **Run the sync**:
   ```bash
   cd /data/dev/CasaVistas/scraper && node kindred-to-guesty.js
   ```

2. **Monitor output** — The script logs:
   - Number of unsynced `[KINDRED]` events found
   - Guesty login status
   - For each event: guest name, dates, inquiry creation, confirmation
   - "Dates already blocked" if Guesty already has a block for those dates
   - Final count: created vs failed

3. **Report results** — Summarize what happened.

## How Kindred events get into the calendar

Kindred home exchange invitations are synced to Google Calendar via a Google Apps Script (`scripts/kindred-calendar-sync.gs`). That script creates `[KINDRED] Guest Name` events. This sync script then picks those up and blocks the dates in Guesty.

## Troubleshooting

- **"No unsynced Kindred events"**: Either all events are already synced, or there are no `[KINDRED]` events in the future. Check Google Calendar directly.
- **"Dates already blocked"**: Someone manually created an owner block in Guesty for the same dates. The script marks it as synced anyway (idempotent).
- **Login failure**: Check secrets — `sops decrypt --input-type dotenv --output-type dotenv secrets.env.enc | grep GUESTY`

## Schedule

This runs automatically via cron on 636desk at 6:30 AM CST daily (after the Guesty scraper). This skill is for manual/on-demand runs.
