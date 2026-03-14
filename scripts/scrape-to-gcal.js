const puppeteer = require("/usr/local/lib/node_modules/n8n/node_modules/puppeteer");
const { CALENDAR_ID, getCalendarClient, sendPushover, loginToGuesty } = require("./shared");

// Configuration
const GUESTY_EMAIL = process.env.GUESTY_EMAIL;
const GUESTY_PASSWORD = process.env.GUESTY_PASSWORD;

if (!GUESTY_EMAIL || !GUESTY_PASSWORD) {
  console.error("ERROR: Missing required environment variables GUESTY_EMAIL and GUESTY_PASSWORD");
  process.exit(1);
}

async function syncToGoogleCalendar(reservations) {
  console.log("Syncing to Google Calendar...");
  const calendar = await getCalendarClient();

  // Get existing [GUEST] events
  const now = new Date();
  const existing = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date(now.getFullYear(), 0, 1).toISOString(),
    timeMax: new Date(now.getFullYear() + 2, 0, 1).toISOString(),
    singleEvents: true,
    maxResults: 500
  });

  // Build list of existing [GUEST] events with their details
  const existingEvents = [];
  (existing.data.items || []).forEach(evt => {
    if (evt.summary?.startsWith("[GUEST]")) {
      const guestName = evt.summary.replace("[GUEST]", "").trim();
      existingEvents.push({
        id: evt.id,
        guest: guestName,
        checkIn: evt.start?.date,
        checkOut: evt.end?.date,
        matched: false
      });
    }
  });

  console.log("Found " + existingEvents.length + " existing [GUEST] events");

  let created = 0, updated = 0, skipped = 0;

  // For each Guesty reservation, find best matching calendar event
  for (const res of reservations) {
    const eventTitle = "[GUEST] " + res.guest;

    // Find existing events for this guest
    const guestEvents = existingEvents.filter(e => e.guest === res.guest && !e.matched);

    if (guestEvents.length === 0) {
      // No existing event - create new
      await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: eventTitle,
          start: { date: res.checkIn },
          end: { date: res.checkOut },
          description: "Guesty guest booking"
        }
      });
      created++;
      console.log("Created: " + eventTitle + " (" + res.checkIn + ")");
    } else {
      // Find best match - prefer exact date match, then closest date
      let bestMatch = guestEvents.find(e => e.checkIn === res.checkIn);

      if (!bestMatch) {
        bestMatch = guestEvents
          .map(e => ({
            ...e,
            daysDiff: Math.abs(new Date(e.checkIn) - new Date(res.checkIn)) / (1000 * 60 * 60 * 24)
          }))
          .filter(e => e.daysDiff <= 7)
          .sort((a, b) => a.daysDiff - b.daysDiff)[0];
      }

      if (bestMatch) {
        bestMatch.matched = true;

        if (bestMatch.checkIn !== res.checkIn || bestMatch.checkOut !== res.checkOut) {
          await calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId: bestMatch.id,
            requestBody: {
              summary: eventTitle,
              start: { date: res.checkIn },
              end: { date: res.checkOut },
              description: "Guesty guest booking"
            }
          });
          updated++;
          console.log("Updated: " + eventTitle + " (" + bestMatch.checkIn + " → " + res.checkIn + ")");
        } else {
          skipped++;
        }
      } else {
        await calendar.events.insert({
          calendarId: CALENDAR_ID,
          requestBody: {
            summary: eventTitle,
            start: { date: res.checkIn },
            end: { date: res.checkOut },
            description: "Guesty guest booking"
          }
        });
        created++;
        console.log("Created: " + eventTitle + " (" + res.checkIn + ")");
      }
    }
  }

  // Delete unmatched future events (cancelled reservations)
  const today = new Date().toISOString().split('T')[0];
  const unmatchedFuture = existingEvents.filter(e => !e.matched && e.checkIn >= today);

  // Safety check: if we'd delete many events but found no reservations, the scraper likely broke
  if (unmatchedFuture.length > 2 && reservations.length === 0) {
    const msg = `Aborting: would delete ${unmatchedFuture.length} events but 0 reservations found — scraper may be broken`;
    console.error(msg);
    await sendPushover("Guesty Scraper ABORT", msg);
    throw new Error(msg);
  }

  let deleted = 0;
  for (const evt of unmatchedFuture) {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: evt.id
    });
    deleted++;
    console.log("Deleted (cancelled): [GUEST] " + evt.guest + " (" + evt.checkIn + ")");
  }

  console.log("\nSync complete: " + created + " created, " + updated + " updated, " + skipped + " unchanged, " + deleted + " deleted");
  return { created, updated, skipped, deleted };
}

async function scrapeGuesty() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await loginToGuesty(page, GUESTY_EMAIL, GUESTY_PASSWORD);

    console.log("Loading reservations...");
    await page.goto("https://bluezoneexperience.guestyowners.com/reservation-report?viewId=6901358070cda2b4e288cc4b", { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    console.log("Sorting by check-in...");
    await page.evaluate(() => {
      const headers = document.querySelectorAll('[class*="header"], th');
      for (const h of headers) {
        if (h.innerText?.includes('CHECK-IN')) { h.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      const headers = document.querySelectorAll('[class*="header"], th');
      for (const h of headers) {
        if (h.innerText?.includes('CHECK-IN')) { h.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        document.querySelectorAll('[class*="drawer"], [class*="Table-wrapper"]').forEach(c => {
          if (c.scrollHeight > c.clientHeight + 50) c.scrollTop = c.scrollHeight;
        });
      });
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 2000));

    console.log("Parsing...");
    const fullText = await page.evaluate(() => document.body.innerText);
    const lines = fullText.split("\n").map(l => l.trim()).filter(l => l);
    const reservations = [];
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)$/;

    // FIXED 2026-02-05: Guesty added CREATION DATE column between CHECK-OUT and LISTING
    for (let i = 0; i < lines.length - 5; i++) {
      if (dateTimeRegex.test(lines[i])) {
        const checkIn = lines[i].split(" ")[0];
        if (dateTimeRegex.test(lines[i+1])) {
          const checkOut = lines[i+1].split(" ")[0];
          // Skip creation date at i+2
          const listing = lines[i+3];  // Changed from i+2 to i+3
          const guest = lines[i+4];     // Changed from i+3 to i+4
          if (guest && !guest.startsWith("$") && !/^\d/.test(guest) && listing && listing.includes("Casa Vistas")) {
            reservations.push({ checkIn, checkOut, guest });
          }
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const upcoming = reservations.filter(r => r.checkOut >= today);

    console.log("\nFound " + reservations.length + " total, " + upcoming.length + " upcoming");
    await browser.close();

    return upcoming;
  } catch (error) {
    console.error("Scrape error:", error.message);
    await browser.close();
    throw error;
  }
}

(async () => {
  try {
    const reservations = await scrapeGuesty();

    if (reservations.length === 0) {
      const msg = "0 upcoming reservations found — possible scraper breakage";
      console.warn(msg);
      await sendPushover("Guesty Scraper Warning", msg);
    }

    const result = await syncToGoogleCalendar(reservations);
    await sendPushover(
      "Guesty Scraper Complete",
      `${result.created} created, ${result.updated} updated, ${result.deleted} deleted`
    );
    console.log("\nDone!");
  } catch (error) {
    console.error("Failed:", error.message);
    await sendPushover("Guesty Scraper FAILED", error.message.substring(0, 200));
    process.exit(1);
  }
})();
