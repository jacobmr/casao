import { Resend } from "resend";

/**
 * Lazy Resend client.
 *
 * Why this exists: `new Resend(undefined)` throws synchronously at module
 * load time when `RESEND_API_KEY` is unset. When any API route module does
 * `const resend = new Resend(process.env.RESEND_API_KEY)` at top level, it
 * crashes `next build`'s page-data collection on machines that don't have
 * the key in their environment (e.g. local builds without secrets piped
 * in). Deferring the instantiation until the first request handler runs
 * makes the module import safe regardless of env state.
 *
 * Production behavior is unchanged — the first request still fails loudly
 * if the key is missing, just with a more useful error.
 */
let cached: Resend | null = null;

export function getResendClient(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set — cannot send email. Check Vercel env vars or local SOPS secrets.",
    );
  }
  cached = new Resend(key);
  return cached;
}
