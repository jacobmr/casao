/**
 * Kindred → Guesty Owner Block Automation
 *
 * Reads [KINDRED] events from Google Calendar and creates owner reservations
 * in Guesty to prevent double-bookings.
 *
 * Uses direct API calls (no browser/Puppeteer needed):
 * 1. POST /api/owners/auth/login → JWT token
 * 2. POST /api/reservations-fegw/inquiries/owner → inquiry ID
 * 3. POST /api/reservations-fegw/reservations/owner/confirmed → confirmed block
 *
 * Runs on 636desk (Portland) via cron.
 */

const {
  CALENDAR_ID,
  GUESTY_EMAIL,
  GUESTY_PASSWORD,
  GUESTY_PORTAL_API_KEY,
  getCalendarClient,
  sendPushover,
} = require("./shared");

const PORTAL_DOMAIN = "bluezoneexperience.guestyowners.com";
const LISTING_ID = "688a8aae483ff0001243e891";
const SYNC_MARKER = "[SYNCED-TO-GUESTY]";

// Owner identity (from Guesty portal profile)
const OWNER = {
  _id: "68bf79b9c9127f17641517ea",
  fullName: "Jacob Reider",
  email: GUESTY_EMAIL,
};
const BOOKER = {
  _id: "68e6b8de4263082eeb8a3a98",
  firstName: "Jacob",
  lastName: "Reider",
  fullName: "Jacob Reider",
};

if (!GUESTY_EMAIL || !GUESTY_PASSWORD) {
  console.error("ERROR: Missing credentials (check secrets.env.enc)");
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

// === Guesty API ===

async function getGuestyToken() {
  const res = await fetch(`https://app.guesty.com/api/owners/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: GUESTY_EMAIL,
      password: GUESTY_PASSWORD,
      hostname: PORTAL_DOMAIN,
      apiKey: GUESTY_PORTAL_API_KEY,
    }),
  });

  if (!res.ok) {
    throw new Error(`Guesty login failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error("Guesty login: no token in response");
  return data.token;
}

async function createOwnerBlock(token, checkIn, checkOut, guestName) {
  // Step 1: Create inquiry
  const inquiryRes = await fetch(
    "https://app.guesty.com/api/reservations-fegw/inquiries/owner",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unitTypeId: LISTING_ID,
        checkInDateLocalized: checkIn,
        checkOutDateLocalized: checkOut,
        guestsCount: 1,
        numberOfGuests: {
          numberOfAdults: 1,
          numberOfChildren: 0,
          numberOfInfants: 0,
        },
        source: "owner",
        unitId: LISTING_ID,
      }),
    },
  );

  if (!inquiryRes.ok) {
    const err = await inquiryRes.text();
    if (err.includes("not availability") || err.includes("already blocked")) {
      console.log(`  Dates already blocked in Guesty — marking as synced`);
      return "already-blocked";
    }
    throw new Error(
      `Inquiry creation failed (${inquiryRes.status}): ${err.substring(0, 200)}`,
    );
  }

  const inquiryData = await inquiryRes.json();
  const inquiryId = inquiryData._id;
  console.log(`  Inquiry created: ${inquiryId}`);

  // Step 2: Confirm reservation with notes
  const confirmRes = await fetch(
    "https://app.guesty.com/api/reservations-fegw/reservations/owner/confirmed",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inquiryId,
        booker: BOOKER,
        ratePlanId: "default-rateplan-id",
        source: "owner",
        unitId: LISTING_ID,
        notes: { other: `Kindred Exchange - ${guestName}` },
        plannedArrival: "15:00",
        plannedDeparture: "10:00",
        creationInfo: {
          owner: { ...OWNER, locale: "en-US" },
        },
      }),
    },
  );

  if (!confirmRes.ok) {
    const err = await confirmRes.text();
    // Dates already blocked = success (block exists, just not from us)
    if (err.includes("not availability") || err.includes("already blocked")) {
      console.log(`  Dates already blocked in Guesty — marking as synced`);
      return "already-blocked";
    }
    throw new Error(
      `Reservation confirm failed (${confirmRes.status}): ${err.substring(0, 200)}`,
    );
  }

  const confirmData = await confirmRes.json();
  console.log(`  Confirmed: ${confirmData._id} (${confirmData.status})`);
  return confirmData._id;
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

  let token;
  try {
    token = await getGuestyToken();
    console.log("Guesty login OK\n");
  } catch (error) {
    console.error("Guesty login failed:", error.message);
    await sendPushover("Kindred Sync FAILED", `Login error: ${error.message}`);
    process.exit(1);
  }

  let created = 0;
  let failed = 0;

  for (const event of events) {
    try {
      console.log(`${event.guestName}: ${event.checkIn} → ${event.checkOut}`);
      await createOwnerBlock(
        token,
        event.checkIn,
        event.checkOut,
        event.guestName,
      );
      await markEventAsSynced(event.id, event.description);
      created++;
      console.log(`  Synced to Guesty\n`);
    } catch (error) {
      failed++;
      console.error(`  FAILED: ${error.message}\n`);
    }
  }

  console.log(`\n=== Complete: ${created} created, ${failed} failed ===`);

  if (created > 0) {
    await sendPushover(
      "Kindred Sync OK",
      `Created ${created} owner block(s) in Guesty`,
    );
  }
  if (failed > 0) {
    await sendPushover(
      "Kindred Sync Partial Failure",
      `${failed} block(s) failed`,
    );
    process.exit(1);
  }
})();
