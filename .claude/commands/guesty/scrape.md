# /guesty:scrape - Run Guesty → Calendar Scraper

Trigger the Guesty reservation scraper that syncs bookings to Google Calendar as `[GUEST]` events.

## What it does

The scraper (`scrape-to-gcal.js`) logs into the Guesty Owners Portal API, fetches all reservations for Casa Vistas, and creates/updates/deletes `[GUEST] Guest Name` events in Google Calendar. The family portal at casavistas.net/family reads these events.

## Steps

1. **Run the scraper**:

   ```bash
   cd /data/dev/CasaVistas/scraper && node scrape-to-gcal.js
   ```

2. **Monitor output** — The script logs:
   - Login status
   - Number of reservations found (total, upcoming, owner blocks)
   - Calendar sync actions (created, updated, deleted, unchanged)
   - Any errors

3. **Report results** — Summarize what happened: how many events synced, any failures.

## Troubleshooting

- **"0 upcoming" despite bookings existing**: The scraper may be broken due to a Guesty UI change. Check the parsing logic in `scrape-to-gcal.js`.
- **Login failure**: Check that secrets are still valid — `sops decrypt --input-type dotenv --output-type dotenv secrets.env.enc | grep GUESTY`
- **Calendar errors**: Check Google SA credentials — `sops decrypt google-sa-credentials.enc.json | jq .client_email`

## Schedule

This runs automatically via cron on 636desk at 6:00 AM CST daily. This skill is for manual/on-demand runs.
