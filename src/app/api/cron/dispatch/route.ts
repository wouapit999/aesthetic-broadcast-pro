import { NextRequest } from "next/server";
import { env } from "@/server/env";
import { dispatchQueued } from "@/server/dispatch";
import { json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron entrypoint (configured in vercel.json to run every minute).
 * Drains a batch of queued WhatsApp messages. Protected by CRON_SECRET —
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`.
 */
async function run(req: NextRequest) {
  if (env.cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.cronSecret}`) {
      return json({ error: "Unauthorized" }, 401);
    }
  }
  const result = await dispatchQueued();
  return json({ ok: true, ...result, ts: Date.now() });
}

export const GET = run;
export const POST = run;
