/**
 * Cancel a Guesty owner reservation via direct API
 *
 * Usage: node cancel-reservation.js <reservationId>
 *
 * Two-step flow:
 * 1. POST /api/reservations-fegw/alterations  → alteration object
 * 2. POST /api/reservations-fegw/alterations/confirm-change → confirmed cancel
 */

const {
  GUESTY_EMAIL,
  GUESTY_PASSWORD,
  GUESTY_PORTAL_API_KEY,
} = require("./shared");

const PORTAL_DOMAIN = "bluezoneexperience.guestyowners.com";

async function getGuestyToken() {
  const res = await fetch("https://app.guesty.com/api/owners/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: GUESTY_EMAIL,
      password: GUESTY_PASSWORD,
      hostname: PORTAL_DOMAIN,
      apiKey: GUESTY_PORTAL_API_KEY,
    }),
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("No token in response");
  return data.token;
}

async function cancelReservation(token, reservationId) {
  console.log(
    `Step 1: Creating cancellation alteration for ${reservationId}...`,
  );

  const alterRes = await fetch(
    "https://app.guesty.com/api/reservations-fegw/alterations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reservationId,
        status: "canceled",
      }),
    },
  );

  if (!alterRes.ok) {
    const err = await alterRes.text();
    throw new Error(
      `Alteration failed (${alterRes.status}): ${err.substring(0, 300)}`,
    );
  }

  const alteration = await alterRes.json();
  console.log(`  Alteration created: ${alteration._id || "OK"}`);

  // Step 2: Confirm the cancellation (requires full alteration object + reservationId)
  console.log("Step 2: Confirming cancellation...");

  const confirmRes = await fetch(
    "https://app.guesty.com/api/reservations-fegw/alterations/confirm-change",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...alteration,
        inquiryId: alteration._id,
        reservationId,
      }),
    },
  );

  if (!confirmRes.ok) {
    const err = await confirmRes.text();
    throw new Error(
      `Confirm failed (${confirmRes.status}): ${err.substring(0, 300)}`,
    );
  }

  const result = await confirmRes.json();
  console.log(`  Canceled: ${result.status || "done"}`);
  return result;
}

// --- Main ---

const reservationId = process.argv[2];
if (!reservationId) {
  console.error("Usage: node cancel-reservation.js <reservationId>");
  process.exit(1);
}

(async () => {
  console.log(`=== Cancel Guesty Reservation ===\n`);
  console.log(`Target: ${reservationId}\n`);

  const token = await getGuestyToken();
  console.log("Login OK\n");

  await cancelReservation(token, reservationId);
  console.log("\nDone.");
})();
