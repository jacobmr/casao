/**
 * Guesty API Probe — Discover backend API endpoints
 *
 * Logs in via Puppeteer, intercepts all network responses to find
 * the JSON API calls the React SPA makes for reservation data.
 */

const { loginToGuesty, launchBrowser } = require("./shared");
require("dotenv").config({ path: __dirname + "/.env" });

const GUESTY_EMAIL = process.env.GUESTY_EMAIL;
const GUESTY_PASSWORD = process.env.GUESTY_PASSWORD;

(async () => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const apiCalls = [];

    page.on("response", async (response) => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();
      const reqHeaders = response.request().headers();

      if (/\.(js|css|png|jpg|svg|woff|ico|map)(\?|$)/.test(url)) return;
      if (
        url.includes("google") ||
        url.includes("analytics") ||
        url.includes("segment")
      )
        return;
      if (
        url.includes("hotjar") ||
        url.includes("sentry") ||
        url.includes("intercom")
      )
        return;

      const entry = {
        method,
        url: url.length > 250 ? url.substring(0, 250) + "..." : url,
        status,
        contentType: response.headers()["content-type"] || "",
      };

      // Capture auth headers
      if (reqHeaders.authorization) {
        entry.authHeader = reqHeaders.authorization.substring(0, 60) + "...";
      }

      // Capture JSON response bodies
      if (entry.contentType.includes("json") && status >= 200 && status < 300) {
        try {
          const body = await response.text();
          entry.bodyPreview = body.substring(0, 3000);
          entry.bodyLength = body.length;

          const lower = body.toLowerCase();
          if (
            lower.includes("reservation") ||
            lower.includes("checkin") ||
            lower.includes("check_in") ||
            lower.includes("checkout") ||
            lower.includes("check-in") ||
            lower.includes("guest")
          ) {
            entry.looksLikeReservationData = true;
          }
        } catch (e) {
          entry.bodyError = e.message;
        }
      }

      apiCalls.push(entry);
    });

    // === Login ===
    console.log("=== PHASE 1: LOGIN ===");
    await loginToGuesty(page, GUESTY_EMAIL, GUESTY_PASSWORD);
    console.log(`Logged in. URL: ${page.url()}`);

    // Capture auth tokens from storage
    const tokens = await page.evaluate(() => {
      const t = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key.toLowerCase().includes("token") ||
          key.toLowerCase().includes("auth") ||
          key.toLowerCase().includes("session")
        ) {
          t[`ls:${key}`] = localStorage.getItem(key)?.substring(0, 100);
        }
      }
      return t;
    });
    if (Object.keys(tokens).length > 0) {
      console.log("\nStorage tokens:", JSON.stringify(tokens, null, 2));
    }

    const cookies = await page.cookies();
    const authCookies = cookies.filter(
      (c) =>
        c.name.includes("token") ||
        c.name.includes("auth") ||
        c.name.includes("session"),
    );
    if (authCookies.length > 0) {
      console.log("\nAuth cookies:");
      authCookies.forEach((c) =>
        console.log(
          `  ${c.name} = ${c.value.substring(0, 50)}... (${c.domain})`,
        ),
      );
    }

    // === Reservation Report ===
    console.log("\n=== PHASE 2: RESERVATION REPORT ===");
    const beforeReport = apiCalls.length;

    await page.goto(
      "https://bluezoneexperience.guestyowners.com/reservation-report?viewId=6901358070cda2b4e288cc4b",
      { waitUntil: "networkidle0", timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 5000));

    console.log(
      `API calls during report load: ${apiCalls.length - beforeReport}`,
    );

    // === Scroll to trigger more API calls ===
    console.log("\n=== PHASE 3: SCROLL ===");
    const beforeScroll = apiCalls.length;

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

    console.log(`API calls during scroll: ${apiCalls.length - beforeScroll}`);

    // === Results ===
    console.log("\n========================================");
    console.log("=== ALL JSON API CALLS ===");
    console.log("========================================\n");

    const jsonCalls = apiCalls.filter((c) => c.contentType.includes("json"));
    console.log(
      `Total API calls: ${apiCalls.length}, JSON calls: ${jsonCalls.length}`,
    );

    jsonCalls.forEach((c) => {
      const flag = c.looksLikeReservationData
        ? " *** RESERVATION DATA ***"
        : "";
      console.log(`\n${c.method} ${c.status} ${c.url}${flag}`);
      if (c.authHeader) console.log(`  Auth: ${c.authHeader}`);
      if (c.bodyLength) console.log(`  Body: ${c.bodyLength} bytes`);
      if (c.bodyPreview) {
        console.log(`  Preview: ${c.bodyPreview.substring(0, 500)}`);
      }
    });

    // Highlight reservation data
    const reservationCalls = apiCalls.filter((c) => c.looksLikeReservationData);
    if (reservationCalls.length > 0) {
      console.log("\n\n========================================");
      console.log("=== RESERVATION DATA ENDPOINTS ===");
      console.log("========================================\n");
      reservationCalls.forEach((c) => {
        console.log(`${c.method} ${c.url}`);
        console.log(`Body (${c.bodyLength} bytes):`);
        console.log(c.bodyPreview);
        console.log("---");
      });
    } else {
      console.log(
        "\n\nNo obvious reservation API calls found in JSON responses.",
      );
      console.log("All non-static URLs captured:");
      apiCalls.forEach((c) =>
        console.log(`  ${c.method} ${c.status} ${c.url}`),
      );
    }

    await browser.close();
    console.log("\nProbe complete.");
  } catch (error) {
    console.error("Probe error:", error.message);
    await browser.close();
    process.exit(1);
  }
})();
