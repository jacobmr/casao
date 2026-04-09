/**
 * Kindred → Guesty Owner Block Automation
 *
 * Reads [KINDRED] events from Google Calendar and creates owner reservations
 * in Guesty to prevent double-bookings.
 *
 * Runs on 636desk (Portland) — local Node.js + Puppeteer.
 *
 * Strategy:
 * 1. Direct API: Try POST to create owner reservation via HTTP (no browser)
 * 2. Puppeteer fallback: Fill out form in Guesty Owners Portal
 */

const {
  CALENDAR_ID,
  GUESTY_EMAIL,
  GUESTY_PASSWORD,
  GUESTY_PORTAL_API_KEY,
  getCalendarClient,
  sendPushover,
  loginToGuesty,
  launchBrowser,
} = require("./shared");

const PORTAL_DOMAIN = "bluezoneexperience.guestyowners.com";
const LISTING_ID = "688a8aae483ff0001243e891";
const SYNC_MARKER = "[SYNCED-TO-GUESTY]";

if (!GUESTY_EMAIL || !GUESTY_PASSWORD) {
  console.error(
    "ERROR: Missing GUESTY_EMAIL and GUESTY_PASSWORD (check secrets.env.enc)",
  );
  process.exit(1);
}

// === Calendar Operations ===

async function getUnsyncedKindredEvents() {
  console.log("Fetching Kindred events from Google Calendar...");
  const calendar = await getCalendarClient();

  const now = new Date();
  const twoYearsOut = new Date(now.getFullYear() + 2, 0, 1);

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: now.toISOString(),
    timeMax: twoYearsOut.toISOString(),
    singleEvents: true,
    maxResults: 100,
    orderBy: "startTime",
  });

  const events = response.data.items || [];
  const kindredEvents = events.filter((evt) => {
    if (!evt.summary?.startsWith("[KINDRED]")) return false;
    if (evt.description?.includes(SYNC_MARKER)) return false;
    return true;
  });

  console.log(`Found ${kindredEvents.length} unsynced [KINDRED] events`);

  return kindredEvents.map((evt) => ({
    id: evt.id,
    summary: evt.summary,
    guestName: evt.summary.replace("[KINDRED]", "").trim(),
    checkIn: evt.start?.date || evt.start?.dateTime?.split("T")[0],
    checkOut: evt.end?.date || evt.end?.dateTime?.split("T")[0],
    description: evt.description || "",
  }));
}

async function markEventAsSynced(eventId, originalDescription) {
  const calendar = await getCalendarClient();
  const newDescription = originalDescription
    ? `${originalDescription}\n\n${SYNC_MARKER} ${new Date().toISOString()}`
    : `${SYNC_MARKER} ${new Date().toISOString()}`;

  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: { description: newDescription },
  });
}

// === Strategy 1: Direct API ===

async function tryCreateViaApi(checkIn, checkOut, guestName) {
  try {
    const loginRes = await fetch(
      `https://app.guesty.com/api/owners/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: GUESTY_EMAIL,
          password: GUESTY_PASSWORD,
          hostname: PORTAL_DOMAIN,
          apiKey: GUESTY_PORTAL_API_KEY,
        }),
      },
    );
    if (!loginRes.ok) return false;
    const { token } = await loginRes.json();

    // Try several possible endpoints for creating owner reservations
    const endpoints = [
      {
        url: `https://app.guesty.com/api/owners/me/reservations`,
        body: {
          listingId: LISTING_ID,
          startDate: checkIn,
          endDate: checkOut,
          note: `Kindred Exchange - ${guestName}`,
        },
      },
      {
        url: `https://app.guesty.com/api/owner-reservations`,
        body: {
          listingId: LISTING_ID,
          checkIn,
          checkOut,
          notes: { other: `Kindred Exchange - ${guestName}` },
        },
      },
    ];

    for (const ep of endpoints) {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ep.body),
      });

      if (res.ok || res.status === 201) {
        console.log(`  API creation succeeded via ${ep.url}`);
        return true;
      }

      const text = await res.text();
      console.log(
        `  API attempt ${ep.url}: ${res.status} ${text.substring(0, 200)}`,
      );
    }

    return false;
  } catch (error) {
    console.log(`  API creation error: ${error.message}`);
    return false;
  }
}

// === Strategy 2: Puppeteer Form Fill ===

async function createViaPuppeteer(events) {
  console.log("Using Puppeteer to create owner reservations...");

  const browser = await launchBrowser();
  let created = 0;
  let failed = 0;
  const errors = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Intercept the actual form submission to capture the API endpoint
    let lastCreationRequest = null;
    page.on("request", (req) => {
      const m = req.method();
      const url = req.url();
      if (
        (m === "POST" || m === "PUT") &&
        url.includes("guesty.com/api") &&
        !url.includes("track") &&
        !url.includes("auth") &&
        !url.includes("split") &&
        !url.includes("datadog")
      ) {
        lastCreationRequest = { method: m, url, body: req.postData() };
        console.log(`  API call captured: ${m} ${url}`);
        if (req.postData())
          console.log(`    Body: ${req.postData().substring(0, 300)}`);
      }
    });

    await loginToGuesty(page, GUESTY_EMAIL, GUESTY_PASSWORD);

    for (const event of events) {
      try {
        console.log(
          `\n--- Creating block: ${event.guestName} (${event.checkIn} → ${event.checkOut}) ---`,
        );

        // Navigate to My Properties
        await page.goto(`https://${PORTAL_DOMAIN}/my-properties`, {
          waitUntil: "networkidle0",
          timeout: 30000,
        });
        await new Promise((r) => setTimeout(r, 2000));

        // Click Casa Vistas property
        await page.evaluate(() => {
          for (const el of document.querySelectorAll("*")) {
            if (
              el.innerText?.includes("Casa Vistas") &&
              el.closest("a,[role=button],button")
            ) {
              (el.closest("a,[role=button],button") || el).click();
              return;
            }
          }
        });
        await new Promise((r) => setTimeout(r, 2000));

        // Click "New reservation"
        const clickedNew = await page.evaluate(() => {
          for (const el of document.querySelectorAll("button, span, a")) {
            const text = el.innerText?.trim().toLowerCase() || "";
            if (
              text === "new reservation" ||
              text.includes("owner reservation") ||
              text.includes("add reservation")
            ) {
              el.click();
              return el.innerText.trim();
            }
          }
          return null;
        });

        if (!clickedNew) {
          throw new Error("Could not find 'New reservation' button");
        }
        await new Promise((r) => setTimeout(r, 2000));

        // Fill dates — use the date input fields
        const [year1, month1, day1] = event.checkIn.split("-");
        const [year2, month2, day2] = event.checkOut.split("-");
        const startFormatted = `${month1}/${day1}/${year1}`;
        const endFormatted = `${month2}/${day2}/${year2}`;

        const startInput = await page.$('input[name="startDate"]');
        if (startInput) {
          await startInput.click({ clickCount: 3 });
          await page.keyboard.type(startFormatted);
          await page.keyboard.press("Tab");
        }
        await new Promise((r) => setTimeout(r, 500));

        const endInput = await page.$('input[name="endDate"]');
        if (endInput) {
          await endInput.click({ clickCount: 3 });
          await page.keyboard.type(endFormatted);
          await page.keyboard.press("Tab");
        }
        await new Promise((r) => setTimeout(r, 500));

        // Fill notes
        const notesInput = await page.$('textarea[name="notes.other"]');
        if (notesInput) {
          await notesInput.click();
          await notesInput.type(`Kindred Exchange - ${event.guestName}`);
        }
        await new Promise((r) => setTimeout(r, 1000));

        // Submit
        lastCreationRequest = null;
        const submitBtn = await page.evaluateHandle(() => {
          for (const b of document.querySelectorAll("button")) {
            if (b.innerText?.toLowerCase().includes("create reservation"))
              return b;
          }
          return null;
        });

        if (submitBtn) {
          await submitBtn.click();
        } else {
          throw new Error("Could not find 'Create reservation' button");
        }

        await new Promise((r) => setTimeout(r, 5000));

        // Check for errors
        const error = await page.evaluate(() => {
          const errorEls = document.querySelectorAll(
            '[class*="error"], [class*="alert"]',
          );
          for (const el of errorEls) {
            if (el.innerText?.trim()) return el.innerText.trim();
          }
          return null;
        });

        if (error && !error.includes("success")) {
          throw new Error(`Form error: ${error}`);
        }

        // If we captured an API call, log it for future direct-API improvements
        if (lastCreationRequest) {
          console.log(`  (Captured creation API for future optimization)`);
        }

        await markEventAsSynced(event.id, event.description);
        created++;
        console.log(`  Success: ${event.guestName}`);
        await new Promise((r) => setTimeout(r, 2000));
      } catch (error) {
        failed++;
        errors.push({ event, error: error.message });
        console.error(`  Failed: ${event.guestName}: ${error.message}`);
        try {
          await page.screenshot({
            path: `/tmp/kindred-error-${Date.now()}.png`,
          });
        } catch (e) {}
      }
    }
  } finally {
    await browser.close();
  }

  return { created, failed, errors };
}

// === Main ===

(async () => {
  console.log(`=== Kindred → Guesty Sync — ${new Date().toISOString()} ===\n`);

  const events = await getUnsyncedKindredEvents();

  if (events.length === 0) {
    console.log("No unsynced Kindred events to process");
    return;
  }

  console.log(`Processing ${events.length} Kindred event(s)...\n`);

  let created = 0;
  let failed = 0;
  const puppeteerNeeded = [];

  // Try direct API first for each event
  for (const event of events) {
    console.log(`${event.guestName}: ${event.checkIn} → ${event.checkOut}`);

    const apiSuccess = await tryCreateViaApi(
      event.checkIn,
      event.checkOut,
      event.guestName,
    );
    if (apiSuccess) {
      await markEventAsSynced(event.id, event.description);
      created++;
      console.log(`  Created via API`);
    } else {
      console.log(`  API failed, queuing for Puppeteer`);
      puppeteerNeeded.push(event);
    }
  }

  // Fall back to Puppeteer for any that failed API
  if (puppeteerNeeded.length > 0) {
    console.log(
      `\nFalling back to Puppeteer for ${puppeteerNeeded.length} event(s)...`,
    );
    const result = await createViaPuppeteer(puppeteerNeeded);
    created += result.created;
    failed += result.failed;
  }

  console.log(`\n=== Sync Complete: ${created} created, ${failed} failed ===`);

  if (created > 0) {
    await sendPushover(
      "Kindred Sync OK",
      `Created ${created} owner block(s) in Guesty`,
    );
  }
  if (failed > 0) {
    await sendPushover(
      "Kindred Sync Partial Failure",
      `${failed} block(s) failed. Check logs.`,
    );
    process.exit(1);
  }
})();
