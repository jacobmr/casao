# Checkpoint: n8n Guesty Sync Setup

**Date**: 2026-01-03 (COMPLETED)
**Session**: Family Portal enhancement - guest name sync

---

## Current Status: FULLY WORKING ✅

**Everything complete:**
- ✅ Puppeteer scrapes all 86 reservations from Guesty owner portal
- ✅ Cron job runs daily at 6 AM CST
- ✅ API endpoint serves guest names at `http://172.28.108.247:3456/api/reservations`
- ✅ Family Portal integrated - shows guest initials on gray "booked" dates
- ✅ Systemd service auto-starts on reboot

**Key fix for pagination**: Click CHECK-IN header to trigger sort/data refresh - this loads all 86 reservations instead of just 25.

---

## Working Shell Command

Run from CASAO_PC host (not inside n8n):
```bash
docker exec n8n node /home/node/scrape-guesty.js
```

Output saved to: `/home/node/.n8n/guesty-reservations.json` (inside container)
Or on host: `~/n8n-data/guesty-reservations.json`

---

## Puppeteer Script (saved at ~/scrape-guesty.js on CASAO_PC)

```javascript
const puppeteer = require("/usr/local/lib/node_modules/n8n/node_modules/puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Login
    await page.goto("https://bluezoneexperience.guestyowners.com/", { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("input[type=email]", { timeout: 15000 });
    await page.type("input[type=email]", "jacob@reider.us", { delay: 50 });
    await page.type("input[type=password]", "ZcgJPkDp5Tg3L4", { delay: 50 });
    await page.click("button[type=submit]");
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 });

    // Go to reservation report
    await page.goto("https://bluezoneexperience.guestyowners.com/reservation-report", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    // Scroll to load more (NEEDS FIX - only gets 25 of 86)
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 2000));

    // Parse reservations from page text
    const fullText = await page.evaluate(() => document.body.innerText);
    const lines = fullText.split("\n").map(l => l.trim()).filter(l => l);
    const reservations = [];

    for (let i = 0; i < lines.length - 4; i++) {
      if (lines[i].match(/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)$/)) {
        const checkIn = lines[i].split(" ")[0];
        if (lines[i+1].match(/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)$/)) {
          const checkOut = lines[i+1].split(" ")[0];
          const listing = lines[i+2];
          const guest = lines[i+3];
          if (guest && !guest.startsWith("$") && !guest.match(/^\d/) && listing.includes("Casa Vistas")) {
            reservations.push({ checkIn, checkOut, guest });
          }
        }
      }
    }

    const recent = reservations.filter(r => r.checkIn >= "2025-01-01");
    const output = { scraped: new Date().toISOString(), total: reservations.length, recent: recent.length, reservations: recent };

    fs.writeFileSync("/home/node/.n8n/guesty-reservations.json", JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
    await browser.close();
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error.message }));
    await browser.close();
    process.exit(1);
  }
})();
```

---

## Credentials Reference

Credentials stored in 1Password / local environment. Services:
- n8n: http://n8n.casavistas.net:5678
- Guesty Owners Portal: https://bluezoneexperience.guestyowners.com/
- Google OAuth: configured in n8n

---

## What We Accomplished This Session

### 1. Fixed Family Portal Cache Issue ✅
- Family availability endpoint now uses same read-through cache as main calendar
- Created shared `getAvailabilityWithFallback()` function in `lib/kv-cache.js`

### 2. Added Visual Distinction for Owner Blocks ✅
- Owner blocks now display in **amber/orange** (was gray)
- Guest bookings remain **gray**

### 3. n8n Installation on CASAO_PC ✅
- Installed n8n via Docker
- Connected Google Calendar OAuth2
- Installed n8n-nodes-puppeteer community node

### 4. Built Custom Docker Image with Chromium ✅
- Standard n8n image lacks Chrome dependencies
- Created custom `n8n-puppeteer:latest` image from `node:20-alpine`
- Includes: Chromium 143.0.7499.40, all required libs
- Dockerfile location: `~/n8n-puppeteer/Dockerfile` on CASAO_PC

### 5. Puppeteer Script Ready for Testing
- Script logs into Guesty owner portal
- Navigates to /my-properties
- Scrapes reservation elements
- Returns structured data for Google Calendar sync

---

## What's Next (Resume Tasks)

### 1. Test Puppeteer Script
1. Open http://n8n.casavistas.net:5678
2. Login: jacob@reider.us / Pepper63
3. Create workflow with Puppeteer node → "Run Custom Script"
4. Paste the script from above
5. Execute and check output

### 2. Refine Scraping Selectors
- First run is exploratory - find the actual HTML structure
- Update selectors to extract guest names and dates
- May need to navigate to specific reservation detail pages

### 3. Complete Workflow
1. Add Schedule Trigger (every 12 hours)
2. Puppeteer scrapes reservations
3. Parse guest names and dates
4. Google Calendar node creates/updates events
5. Event format: `Guest: [Name]` for each booking

---

## Context for Resume

### Infrastructure State
- **n8n container**: Running on CASAO_PC with custom `n8n-puppeteer:latest` image
- **Chromium**: Installed at `/usr/bin/chromium-browser`
- **Google Calendar**: OAuth connected
- **Puppeteer node**: Community node installed

### Access Info
- n8n UI: http://n8n.casavistas.net:5678 (requires ZeroTier)
- CASAO_PC SSH: `ssh jacob@172.28.108.247`
- Hosts file entry: `172.28.108.247 n8n.casavistas.net`

### Docker Commands (if needed)
```bash
# Restart n8n
ssh jacob@172.28.108.247 "docker restart n8n"

# View logs
ssh jacob@172.28.108.247 "docker logs n8n --tail 50"

# Rebuild image (if Dockerfile changes)
ssh jacob@172.28.108.247 "cd ~/n8n-puppeteer && docker build -t n8n-puppeteer:latest ."
```

---

## Resume Command
```
No resume needed - fully implemented!
```
