import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "redis";
import { verifyFamilySession } from "@/lib/family-kv";

const KV_TRIGGER_KEY = "scraper:trigger";
const KV_STATUS_KEY = "scraper:status";
const TRIGGER_TTL = 30 * 60; // 30 min auto-expire

// Use global singleton to prevent connection exhaustion in serverless
const globalForRedis = globalThis as unknown as {
  scraperRedis?: ReturnType<typeof createClient>;
};

async function getRedis() {
  if (globalForRedis.scraperRedis?.isOpen) return globalForRedis.scraperRedis;
  if (!globalForRedis.scraperRedis) {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }
    globalForRedis.scraperRedis = createClient({
      url: process.env.REDIS_URL,
    });
    globalForRedis.scraperRedis.on("error", (err) =>
      console.error("Redis Client Error:", err),
    );
  }
  if (!globalForRedis.scraperRedis.isOpen)
    await globalForRedis.scraperRedis.connect();
  return globalForRedis.scraperRedis;
}

async function isAuthorized(request: Request): Promise<boolean> {
  // Bearer token auth (CASAO poller)
  const authHeader = request.headers.get("authorization");
  const scraperSecret = process.env.SCRAPER_SECRET;
  if (
    scraperSecret &&
    authHeader?.startsWith("Bearer ") &&
    authHeader.slice(7) === scraperSecret
  ) {
    return true;
  }

  // Family session cookie auth (admin UI)
  const cookieStore = await cookies();
  const session = cookieStore.get("family_session")?.value;
  if (session && (await verifyFamilySession(session))) {
    return true;
  }

  return false;
}

/**
 * GET /api/family/admin/scraper
 * Returns scraper status: whether a trigger is pending + last run info
 */
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const redis = await getRedis();
    const [trigger, statusRaw] = await Promise.all([
      redis.get(KV_TRIGGER_KEY),
      redis.get(KV_STATUS_KEY),
    ]);

    const status = statusRaw ? JSON.parse(statusRaw) : null;

    return NextResponse.json({
      pending: trigger === "requested",
      lastRun: status?.lastRun ?? null,
      result: status?.result ?? null,
      reservations: status?.reservations ?? null,
    });
  } catch (error) {
    console.error("Scraper API error:", error);
    return NextResponse.json(
      { error: "Failed to get scraper status" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/family/admin/scraper
 * Actions:
 *   { action: "trigger" }   — Admin requests a re-scrape (sets KV flag)
 *   { action: "complete", result: "success", reservations: N } — CASAO reports done
 */
export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const redis = await getRedis();

    if (body.action === "trigger") {
      await redis.set(KV_TRIGGER_KEY, "requested", { EX: TRIGGER_TTL });
      console.log("🔄 Scraper trigger flag set by admin");
      return NextResponse.json({ success: true, pending: true });
    }

    if (body.action === "complete") {
      // Clear trigger flag
      await redis.del(KV_TRIGGER_KEY);

      // Write status
      const status = {
        lastRun: new Date().toISOString(),
        result: body.result || "unknown",
        reservations: body.reservations ?? null,
      };
      await redis.set(KV_STATUS_KEY, JSON.stringify(status));

      console.log("✅ Scraper completed:", status);
      return NextResponse.json({ success: true, pending: false, ...status });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "trigger" or "complete".' },
      { status: 400 },
    );
  } catch (error) {
    console.error("Scraper API error:", error);
    return NextResponse.json(
      { error: "Failed to process scraper action" },
      { status: 500 },
    );
  }
}
