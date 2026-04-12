/**
 * Guesty Reservation Scraper v2 — Direct API + Network Interception
 *
 * Strategy (in priority order):
 * 1. Direct API: POST login → GET reservations-reports (no browser needed)
 * 2. Network interception: Puppeteer login, intercept JSON API responses
 * 3. DOM fallback: Parse document.body.innerText (v1 approach, last resort)
 *
 * Runs on 636desk (Portland) as a local Node.js script.
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

if (!GUESTY_EMAIL || !GUESTY_PASSWORD) {
  console.error(
    "ERROR: Missing GUESTY_EMAIL and GUESTY_PASSWORD (check secrets.env.enc)",
  );
  process.exit(1);
}

// === API Constants (discovered via probe) ===

const GUESTY_API = "https://app.guesty.com/api";
const PORTAL_DOMAIN = "bluezoneexperience.guestyowners.com";
const REPORT_VIEW_ID = "6901358070cda2b4e288cc4b";
const REPORT_COLUMNS = [
  "checkIn",
  "checkOut",
  "creationDate",
  "listing",
  "guest",
  "status",
  "source",
  "confirmationCode",
  "guest.email",
  "guest.phone",
].join("+");

// === Strategy 1: Direct API (no browser) ===

async function tryDirectApi() {
  console.log("Strategy 1: Direct API call...");

  try {
    // Login
    const loginRes = await fetch(`${GUESTY_API}/owners/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: GUESTY_EMAIL,
        password: GUESTY_PASSWORD,
        hostname: PORTAL_DOMAIN,
        apiKey: GUESTY_PORTAL_API_KEY,
      }),
    });

    if (!loginRes.ok) {
      console.log(`  Login failed: ${loginRes.status} ${loginRes.statusText}`);
      return null;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) {
      console.log("  Login response missing token");
      return null;
    }
    console.log("  Login OK, got JWT token");

    // Fetch reservation report (paginated — max 100 per request)
    const allRows = [];
    let skip = 0;
    const limit = 100;

    while (true) {
      const reportUrl =
        `${GUESTY_API}/reservations-reports/owner-portal?` +
        `smartView=true&columns=${REPORT_COLUMNS}` +
        `&viewId=${REPORT_VIEW_ID}` +
        `&skip=${skip}&limit=${limit}&sort=checkIn`;

      const reportRes = await fetch(reportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!reportRes.ok) {
        console.log(
          `  Report fetch failed: ${reportRes.status} ${reportRes.statusText}`,
        );
        break;
      }

      const reportData = await reportRes.json();
      const rows = reportData.data || [];
      console.log(`  Fetched page at skip=${skip}: ${rows.length} rows`);
      allRows.push(...rows);

      if (rows.length < limit) break; // Last page
      skip += limit;
    }

    if (allRows.length === 0) return null;
    return parseReportRows(allRows);
  } catch (error) {
    console.log(`  Direct API error: ${error.message}`);
    return null;
  }
}

// === Strategy 2: Network Interception ===

async function tryNetworkInterception() {
  console.log("Strategy 2: Network interception via Puppeteer...");

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const capturedData = [];

    page.on("response", async (response) => {
      const url = response.url();
      if (
        !url.includes("reservations-reports/owner-portal") ||
        !url.includes("columns=")
      )
        return;
      if (response.status() < 200 || response.status() >= 300) return;

      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        if (parsed.data && Array.isArray(parsed.data)) {
          capturedData.push(...parsed.data);
          console.log(
            `  Intercepted ${parsed.data.length} reservation records from API`,
          );
        }
      } catch (e) {
        // Skip non-JSON or parse errors
      }
    });

    await loginToGuesty(page, GUESTY_EMAIL, GUESTY_PASSWORD);

    await page.goto(
      `https://${PORTAL_DOMAIN}/reservation-report?viewId=${REPORT_VIEW_ID}`,
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 5000));

    // Scroll to trigger pagination API calls
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => {
        document
          .querySelectorAll(
            '[class*="drawer"], [class*="Table-wrapper"], [class*="scroll"], [class*="virtual"]',
          )
          .forEach((c) => {
            if (c.scrollHeight > c.clientHeight + 50)
              c.scrollTop = c.scrollHeight;
          });
      });
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 3000));

    await browser.close();

    if (capturedData.length === 0) return null;

    return parseReportRows(capturedData);
  } catch (error) {
    console.log(`  Network interception error: ${error.message}`);
    try {
      await browser.close();
    } catch (e) {}
    return null;
  }
}

// === Strategy 3: DOM Fallback (v1 approach) ===

async function tryDomFallback() {
  console.log("Strategy 3: DOM text parsing (v1 fallback)...");

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await loginToGuesty(page, GUESTY_EMAIL, GUESTY_PASSWORD);

    await page.goto(
      `https://${PORTAL_DOMAIN}/reservation-report?viewId=${REPORT_VIEW_ID}`,
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 3000));

    // Sort by check-in
    for (let click = 0; click < 2; click++) {
      await page.evaluate(() => {
        const headers = document.querySelectorAll('[class*="header"], th');
        for (const h of headers) {
          if (h.innerText?.includes("CHECK-IN")) {
            h.click();
            return;
          }
        }
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Scroll to load
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        document
          .querySelectorAll('[class*="drawer"], [class*="Table-wrapper"]')
          .forEach((c) => {
            if (c.scrollHeight > c.clientHeight + 50)
              c.scrollTop = c.scrollHeight;
          });
      });
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 2000));

    const fullText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    const lines = fullText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(AM|PM)$/;

    // Try multiple column offset patterns
    const offsets = [
      { listing: 3, guest: 4, label: "3-col (creation date)" },
      { listing: 2, guest: 3, label: "2-col (no creation date)" },
      { listing: 4, guest: 5, label: "4-col (extra column)" },
    ];

    for (const offset of offsets) {
      const found = [];
      for (let i = 0; i < lines.length - (offset.guest + 1); i++) {
        if (dateTimeRegex.test(lines[i]) && dateTimeRegex.test(lines[i + 1])) {
          const checkIn = lines[i].split(" ")[0];
          const checkOut = lines[i + 1].split(" ")[0];
          const listing = lines[i + offset.listing];
          const guest = lines[i + offset.guest];
          const durationDays = Math.round(
            (new Date(checkOut + "T00:00:00Z") -
              new Date(checkIn + "T00:00:00Z")) /
              (1000 * 60 * 60 * 24),
          );
          if (
            guest &&
            !guest.startsWith("$") &&
            !/^\d/.test(guest) &&
            listing &&
            listing.includes("Casa Vistas") &&
            durationDays > 0 &&
            durationDays <= 90
          ) {
            found.push({ checkIn, checkOut, guest, source: "dom-fallback" });
          } else if (durationDays > 90) {
            console.warn(
              `  Skipped suspicious DOM reservation: ${guest} (${checkIn} → ${checkOut}, ${durationDays} days)`,
            );
          }
        }
      }
      if (found.length > 0) {
        console.log(
          `  DOM pattern "${offset.label}" found ${found.length} reservations`,
        );
        return found;
      }
    }

    return null;
  } catch (error) {
    console.log(`  DOM fallback error: ${error.message}`);
    try {
      await browser.close();
    } catch (e) {}
    return null;
  }
}

// === Data Parsers ===

/**
 * Parse the JSON response from the reservations-reports API.
 * Structure: { data: [{ checkIn: {value: "2025-01-01 3:00 PM"}, ... }] }
 */
function parseReportData(reportData) {
  const rows = reportData.data || reportData.results || [];
  if (rows.length === 0) {
    console.log("  Report returned 0 rows");
    return null;
  }
  return parseReportRows(rows);
}

function parseReportRows(rows) {
  const reservations = [];
  let skippedCanceled = 0,
    skippedOwner = 0,
    skippedInquiry = 0;

  for (const row of rows) {
    // Extract values — API wraps in {value: "..."}, {children: "..."}, or {name: "..."}
    const val = (field) => {
      if (!field) return null;
      if (typeof field === "string") return field;
      return field.value || field.children || field.name || null;
    };

    const checkInRaw = val(row.checkIn);
    const checkOutRaw = val(row.checkOut);
    const listing = val(row.listing) || val(row.listingId) || "";
    const guest = val(row.guest) || "Unknown Guest";
    const status = val(row.status) || "";
    const source = val(row.source) || "";
    const reservationId = row._id || "";
    const confirmationCode = val(row.confirmationCode) || "";

    if (!checkInRaw || !checkOutRaw) continue;

    // Normalize date: "2025-01-01 3:00 PM" → "2025-01-01"
    const checkIn = checkInRaw.split(" ")[0];
    const checkOut = checkOutRaw.split(" ")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) continue;

    // Filter to Casa Vistas
    if (listing && !listing.includes("Casa Vistas")) continue;

    // Skip canceled reservations
    if (status === "canceled") {
      skippedCanceled++;
      continue;
    }

    // Track owner blocks separately (still synced — family calendar needs them)
    const isOwnerBlock = source === "owner";
    if (isOwnerBlock) skippedOwner++;

    // Skip inquiries — they aren't confirmed bookings and Guesty doesn't hold
    // the dates, so writing them to the calendar creates phantom "booked"
    // blocks that can conflict with real incoming reservations.
    if (status === "inquiry") {
      skippedInquiry++;
      continue;
    }

    // Sanity check: skip reservations longer than 90 days (likely parsing errors)
    const durationDays = Math.round(
      (new Date(checkOut + "T00:00:00Z") - new Date(checkIn + "T00:00:00Z")) /
        (1000 * 60 * 60 * 24),
    );
    if (durationDays <= 0 || durationDays > 90) {
      console.warn(
        `  Skipped suspicious reservation: ${guest} (${checkIn} → ${checkOut}, ${durationDays} days)`,
      );
      continue;
    }

    reservations.push({
      checkIn,
      checkOut,
      guest,
      status,
      source,
      reservationId,
      confirmationCode,
      isOwnerBlock,
    });
  }

  console.log(
    `  Parsed ${reservations.length} reservations from ${rows.length} total rows` +
      ` (skipped: ${skippedCanceled} canceled, ${skippedInquiry} inquiries; includes ${skippedOwner} owner blocks)`,
  );
  return reservations.length > 0 ? reservations : null;
}

// === Calendar Sync ===
//
// Events are keyed by Guesty reservation ID via a machine-readable marker
// embedded in the event description:
//
//   [GUEST] Jane Doe
//   ├── description:
//   │   Source: Direct
//   │   Confirmation: GY-abc123
//   │   Status: confirmed
//   │   Synced: 2026-04-12T22:48:27Z
//   │   ─────
//   │   guesty_reservation_id: 68e87294b25f11d7aad2c728
//
// The last line is the source of truth for matching. Events without the
// marker (legacy events from earlier versions of the scraper, or events
// created by other tools) fall back to name+date fuzzy matching exactly
// once — on their next sync, they get re-stamped with the marker and
// become id-matched thereafter.

const MARKER_PREFIX = "guesty_reservation_id: ";

function buildEventDescription(res) {
  const lines = [
    `Source: ${res.source || "(unknown)"}`,
    `Confirmation: ${res.confirmationCode || "(none)"}`,
    `Status: ${res.status || "(unknown)"}`,
    `Synced: ${new Date().toISOString()}`,
    "─────",
    `${MARKER_PREFIX}${res.reservationId || "(unknown)"}`,
  ];
  return lines.join("\n");
}

function extractReservationId(description) {
  if (!description) return null;
  const match = description.match(/guesty_reservation_id:\s*([a-f0-9]+)/i);
  return match ? match[1] : null;
}

async function syncToGoogleCalendar(reservations) {
  console.log("Syncing to Google Calendar...");
  const calendar = await getCalendarClient();

  const now = new Date();
  const existing = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date(now.getFullYear(), 0, 1).toISOString(),
    timeMax: new Date(now.getFullYear() + 2, 0, 1).toISOString(),
    singleEvents: true,
    maxResults: 500,
  });

  // Split existing [GUEST] events into two buckets: stamped (have a
  // reservationId marker we can match against) and legacy (fall back to
  // name+date).
  const byReservationId = new Map();
  const legacyEvents = [];
  (existing.data.items || []).forEach((evt) => {
    if (!evt.summary?.startsWith("[GUEST]")) return;
    const reservationId = extractReservationId(evt.description);
    const entry = {
      id: evt.id,
      guest: evt.summary.replace("[GUEST]", "").trim(),
      checkIn: evt.start?.date,
      checkOut: evt.end?.date,
      description: evt.description || "",
      reservationId,
      matched: false,
    };
    if (reservationId) {
      byReservationId.set(reservationId, entry);
    } else {
      legacyEvents.push(entry);
    }
  });

  console.log(
    `Found ${byReservationId.size + legacyEvents.length} existing [GUEST] events ` +
      `(${byReservationId.size} stamped, ${legacyEvents.length} legacy)`,
  );

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const res of reservations) {
    const eventTitle = "[GUEST] " + res.guest;
    const newDescription = buildEventDescription(res);
    const requestBody = {
      summary: eventTitle,
      start: { date: res.checkIn },
      end: { date: res.checkOut },
      description: newDescription,
    };

    // Step 1: id match (stamped events)
    let match = null;
    if (res.reservationId && byReservationId.has(res.reservationId)) {
      match = byReservationId.get(res.reservationId);
    }

    // Step 2: legacy fallback by name (exact check-in, then ±7 days).
    // Keep references to the original legacyEvents entries so .matched flags
    // flow back to the right object.
    if (!match) {
      const candidates = legacyEvents.filter(
        (e) => e.guest === res.guest && !e.matched,
      );
      match = candidates.find((e) => e.checkIn === res.checkIn);
      if (!match) {
        const DAY_MS = 1000 * 60 * 60 * 24;
        const targetTs = new Date(res.checkIn).getTime();
        let best = null;
        let bestDiff = Infinity;
        for (const e of candidates) {
          const diff =
            Math.abs(new Date(e.checkIn).getTime() - targetTs) / DAY_MS;
          if (diff <= 7 && diff < bestDiff) {
            best = e;
            bestDiff = diff;
          }
        }
        match = best;
      }
    }

    if (!match) {
      await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody,
      });
      created++;
      console.log(`Created: ${eventTitle} (${res.checkIn})`);
      continue;
    }

    match.matched = true;

    // Update if dates changed OR description needs stamping/refreshing.
    // We always refresh the description so `Synced:` timestamp updates,
    // but only log it as "updated" when something user-visible changed.
    const datesChanged =
      match.checkIn !== res.checkIn || match.checkOut !== res.checkOut;
    const needsStamping = !match.reservationId && res.reservationId;

    if (datesChanged || needsStamping) {
      await calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: match.id,
        requestBody,
      });
      updated++;
      const reason = datesChanged
        ? `${match.checkIn} → ${res.checkIn}`
        : "stamped with reservation id";
      console.log(`Updated: ${eventTitle} (${reason})`);
    } else {
      // Still refresh description so Synced: timestamp stays current.
      // Cheap no-op from the user's perspective.
      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId: match.id,
        requestBody: { description: newDescription },
      });
      skipped++;
    }
  }

  // Delete unmatched future events (cancelled reservations). An event is
  // unmatched if no reservation in this run claimed it — either it was
  // canceled in Guesty, or it's a stale [GUEST] event from a prior sync
  // that no longer maps to any current reservation.
  const today = new Date().toISOString().split("T")[0];
  const unmatchedFuture = [
    ...legacyEvents.filter((e) => !e.matched),
    ...Array.from(byReservationId.values()).filter((e) => !e.matched),
  ].filter((e) => e.checkIn >= today);

  // Safety: don't mass-delete if scraper found nothing
  if (unmatchedFuture.length > 2 && reservations.length === 0) {
    const msg = `Aborting: would delete ${unmatchedFuture.length} events but 0 reservations found`;
    console.error(msg);
    await sendPushover("Guesty Scraper ABORT", msg);
    throw new Error(msg);
  }

  let deleted = 0;
  for (const evt of unmatchedFuture) {
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: evt.id });
    deleted++;
    console.log(
      "Deleted (cancelled): [GUEST] " + evt.guest + " (" + evt.checkIn + ")",
    );
  }

  console.log(
    "\nSync complete: " +
      created +
      " created, " +
      updated +
      " updated, " +
      skipped +
      " unchanged, " +
      deleted +
      " deleted",
  );
  return { created, updated, skipped, deleted };
}

// === Main ===

(async () => {
  console.log(`=== Guesty Scraper v2 — ${new Date().toISOString()} ===\n`);

  let reservations = null;
  let strategy = "none";

  // Try strategies in order
  reservations = await tryDirectApi();
  if (reservations) {
    strategy = "direct-api";
  } else {
    reservations = await tryNetworkInterception();
    if (reservations) {
      strategy = "network-interception";
    } else {
      reservations = await tryDomFallback();
      if (reservations) {
        strategy = "dom-fallback";
      }
    }
  }

  if (!reservations || reservations.length === 0) {
    const msg = "All 3 strategies failed — 0 reservations found";
    console.error(msg);
    await sendPushover("Guesty Scraper FAILED", msg);
    process.exit(1);
  }

  // Filter to upcoming
  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter((r) => r.checkOut >= today);

  console.log(`\n${upcoming.length} upcoming reservations (via ${strategy}):`);
  upcoming.forEach((r) =>
    console.log(`  ${r.checkIn} → ${r.checkOut}: ${r.guest}`),
  );

  try {
    const result = await syncToGoogleCalendar(upcoming);
    await sendPushover(
      "Guesty Scraper OK",
      `${result.created} new, ${result.updated} updated, ${result.deleted} deleted (${strategy})`,
    );
    console.log("\nDone!");
  } catch (error) {
    console.error("Sync failed:", error.message);
    await sendPushover(
      "Guesty Scraper FAILED",
      error.message.substring(0, 200),
    );
    process.exit(1);
  }
})();
