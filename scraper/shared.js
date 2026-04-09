/**
 * Shared utilities for Casa Vistas scraper scripts
 *
 * Runs on 636desk (Portland) — local Node.js, no Docker container.
 * Secrets decrypted at runtime via SOPS — no plaintext on disk.
 */

const { google } = require("googleapis");
const { execFileSync } = require("child_process");
const https = require("https");

const SCRAPER_DIR = __dirname;

// Decrypt env vars from SOPS at startup (piped, never written to disk)
let env = {};
try {
  const decrypted = execFileSync(
    "sops",
    [
      "decrypt",
      "--input-type",
      "dotenv",
      "--output-type",
      "dotenv",
      `${SCRAPER_DIR}/secrets.env.enc`,
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  for (const line of decrypted.split("\n")) {
    const match = line.match(/^([^#=][^=]*)=(.*)/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
} catch (e) {
  console.error("FATAL: Failed to decrypt secrets.env.enc:", e.message);
  console.error("Make sure SOPS + age key are configured on this machine.");
  process.exit(1);
}

const CALENDAR_ID = env.GOOGLE_CALENDAR_ID;
const PUSHOVER_USER_KEY = env.PUSHOVER_USER_KEY;
const PUSHOVER_API_TOKEN = env.PUSHOVER_API_TOKEN;

// Export env vars for use by other scripts (e.g. Guesty login)
const GUESTY_EMAIL = env.GUESTY_EMAIL;
const GUESTY_PASSWORD = env.GUESTY_PASSWORD;
const GUESTY_PORTAL_API_KEY = env.GUESTY_PORTAL_API_KEY;

let calendarClientInstance = null;

async function getCalendarClient() {
  if (calendarClientInstance) return calendarClientInstance;

  // Decrypt Google SA credentials via SOPS (piped, never on disk)
  const credJson = execFileSync(
    "sops",
    ["decrypt", `${SCRAPER_DIR}/google-sa-credentials.enc.json`],
    { encoding: "utf8", timeout: 10000 },
  );
  const credentials = JSON.parse(credJson);
  const privateKey = credentials.private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  await auth.authorize();
  calendarClientInstance = google.calendar({ version: "v3", auth });
  return calendarClientInstance;
}

function sendPushover(title, message) {
  if (!PUSHOVER_USER_KEY || !PUSHOVER_API_TOKEN) {
    console.warn("Pushover not configured — skipping notification:", title);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      token: PUSHOVER_API_TOKEN,
      user: PUSHOVER_USER_KEY,
      title,
      message,
    });

    const req = https.request(
      {
        hostname: "api.pushover.net",
        path: "/1/messages.json",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", resolve);
      },
    );
    req.on("error", (err) => {
      console.error("Pushover error:", err.message);
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function loginToGuesty(page, email, password) {
  console.log("Logging in to Guesty Owners Portal...");

  await page.goto("https://bluezoneexperience.guestyowners.com/", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  await page.waitForSelector("input[type=email]", { timeout: 15000 });
  await page.type("input[type=email]", email, { delay: 50 });
  await page.type("input[type=password]", password, { delay: 50 });
  await page.click("button[type=submit]");
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 });

  console.log("Login successful");
}

function launchBrowser() {
  const puppeteer = require("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

module.exports = {
  CALENDAR_ID,
  GUESTY_EMAIL,
  GUESTY_PASSWORD,
  GUESTY_PORTAL_API_KEY,
  getCalendarClient,
  sendPushover,
  loginToGuesty,
  launchBrowser,
};
