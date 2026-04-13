/**
 * Handoff Lead Persistence
 *
 * Every time a guest fills out the Casa Vistas handoff lead-capture form
 * (app/api/handoff/route.js), we store their details in Redis so the lead
 * is recoverable even if they bail before completing payment on Blue
 * Zone's Guesty page.
 *
 * Data model:
 *
 *   lead:{uuid}          — JSON blob with the full lead payload, 30-day TTL.
 *   leads:index          — Sorted set keyed by createdAt (ms). Members are
 *                          lead UUIDs. Used for listing/filtering from the
 *                          admin UI without scanning every key.
 *
 * All operations are best-effort. If Redis is down, the handoff flow still
 * completes — we just lose the lead record for that request.
 */

import { createClient } from "redis";

let redisClient = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) return redisClient;
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) =>
      console.error("Redis (leads) error:", err),
    );
  }
  if (!redisClient.isOpen) await redisClient.connect();
  return redisClient;
}

const LEAD_TTL_SECONDS = 30 * 24 * 60 * 60;
const INDEX_KEY = "leads:index";

/**
 * Persist a new lead capture from the handoff flow.
 *
 * @param {object} lead
 * @param {string} lead.uuid
 * @param {string} lead.name           Combined display name (e.g. "Jane Doe")
 * @param {string} [lead.firstName]    Split first name (for follow-up email personalization)
 * @param {string} [lead.lastName]     Split last name
 * @param {string} lead.email
 * @param {string} [lead.phone]        Optional phone number
 * @param {string} lead.checkIn        YYYY-MM-DD
 * @param {string} lead.checkOut       YYYY-MM-DD
 * @param {number|string} lead.adults
 * @param {string[]} [lead.experiences]
 * @param {string} [lead.promoCode]
 *
 * @returns {Promise<boolean>} true on success, false if Redis is down or misconfigured
 */
export async function saveLead(lead) {
  if (!process.env.REDIS_URL) return false;
  try {
    const redis = await getRedisClient();
    const now = Date.now();
    const payload = {
      uuid: lead.uuid,
      name: lead.name,
      firstName: lead.firstName || null,
      lastName: lead.lastName || null,
      email: lead.email,
      phone: lead.phone || null,
      checkIn: lead.checkIn,
      checkOut: lead.checkOut,
      adults: Number(lead.adults) || 2,
      experiences: lead.experiences || [],
      promoCode: lead.promoCode || null,
      createdAt: new Date(now).toISOString(),
      stage: "handoff_completed",
    };

    await redis.set(`lead:${lead.uuid}`, JSON.stringify(payload), {
      EX: LEAD_TTL_SECONDS,
    });
    await redis.zAdd(INDEX_KEY, { score: now, value: lead.uuid });
    // Trim the index to the most recent 10000 leads — enough for years of
    // history at typical volumes, cheap to store, prevents unbounded growth.
    await redis.zRemRangeByRank(INDEX_KEY, 0, -10001);
    return true;
  } catch (error) {
    console.error("saveLead failed:", error);
    return false;
  }
}

/**
 * Fetch a single lead by UUID. Returns null if missing, expired, or Redis unavailable.
 */
export async function getLead(uuid) {
  if (!process.env.REDIS_URL) return null;
  try {
    const redis = await getRedisClient();
    const raw = await redis.get(`lead:${uuid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("getLead failed:", error);
    return null;
  }
}

/**
 * List recent leads, newest first. Intended for admin UI.
 *
 * @param {object} [opts]
 * @param {number} [opts.limit=50]    Max leads to return.
 * @param {number} [opts.since]       Unix ms — only return leads created after this timestamp.
 * @returns {Promise<object[]>}
 */
export async function listLeads({ limit = 50, since = 0 } = {}) {
  if (!process.env.REDIS_URL) return [];
  try {
    const redis = await getRedisClient();
    // zRange with REV returns newest-first when using BYSCORE+REV.
    const uuids = await redis.zRange(INDEX_KEY, "+inf", since || "-inf", {
      BY: "SCORE",
      REV: true,
      LIMIT: { offset: 0, count: limit },
    });
    if (uuids.length === 0) return [];
    // Single round-trip mGet instead of N parallel get calls — one network
    // hop regardless of page size.
    const keys = uuids.map((u) => `lead:${u}`);
    const raws = await redis.mGet(keys);
    return raws
      .filter(Boolean)
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.error("listLeads failed:", error);
    return [];
  }
}

/**
 * Mark a lead as converted (matching reservation found in Guesty) or
 * abandoned (scraper didn't find a matching reservation within window).
 * Preserves the rest of the payload — only touches stage + completedAt.
 */
export async function updateLeadStage(uuid, stage) {
  if (!process.env.REDIS_URL) return false;
  try {
    const redis = await getRedisClient();
    const raw = await redis.get(`lead:${uuid}`);
    if (!raw) return false;
    const lead = JSON.parse(raw);
    lead.stage = stage;
    lead.completedAt = new Date().toISOString();
    // Preserve TTL on the key by refreshing it with the same duration.
    // (Redis KEEPTTL would work but isn't universally supported across clients.)
    await redis.set(`lead:${uuid}`, JSON.stringify(lead), {
      EX: LEAD_TTL_SECONDS,
    });
    return true;
  } catch (error) {
    console.error("updateLeadStage failed:", error);
    return false;
  }
}
