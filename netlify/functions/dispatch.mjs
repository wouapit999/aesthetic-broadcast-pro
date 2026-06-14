// Netlify Scheduled Function — runs every minute and asks the app to drain a
// batch of queued WhatsApp messages. It simply calls the internal API route,
// which holds all the DB/WhatsApp logic, so no Prisma bundling is needed here.

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!base) {
    console.error("No site URL available to call /api/cron/dispatch");
    return;
  }
  try {
    const res = await fetch(`${base}/api/cron/dispatch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
    });
    const body = await res.json().catch(() => ({}));
    console.log("dispatch ->", res.status, JSON.stringify(body));
  } catch (err) {
    console.error("dispatch failed", err);
  }
};

export const config = {
  schedule: "* * * * *", // every minute
};
