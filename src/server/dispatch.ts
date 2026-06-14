import { prisma } from "./prisma";
import { env } from "./env";
import { sendWhatsAppMessage } from "./whatsapp";

/**
 * Drain up to `limit` queued campaign messages and send them via the WhatsApp
 * Cloud API. Designed to be called repeatedly by a Vercel Cron job, so very
 * large broadcasts are processed across many short serverless invocations
 * instead of one long-running worker. Also called once (best-effort) right
 * after a campaign is sent for immediate progress.
 *
 * Returns the number of messages processed.
 */
export async function dispatchQueued(limit = env.sendBatchSize): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  // Promote any scheduled campaigns whose time has come.
  await prisma.campaign.updateMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    data: { status: "sending" },
  });

  const settings = await prisma.settings.findFirst({
    where: {
      whatsappPhoneNumberId: { not: null },
      whatsappAccessToken: { not: null },
    },
  });

  // Pick queued logs whose campaign is actively sending and due.
  const logs = await prisma.campaignLog.findMany({
    where: {
      status: "queued",
      campaign: {
        status: "sending",
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
    },
    include: { contact: true, campaign: true },
    take: limit,
    orderBy: { timestamp: "asc" },
  });

  let sent = 0;
  let failed = 0;
  const touchedCampaigns = new Set<string>();

  for (const log of logs) {
    touchedCampaigns.add(log.campaignId);

    if (!settings?.whatsappPhoneNumberId || !settings?.whatsappAccessToken) {
      await prisma.campaignLog.update({
        where: { id: log.id },
        data: { status: "failed", error: "WhatsApp not configured" },
      });
      failed++;
      continue;
    }

    const result = await sendWhatsAppMessage(
      {
        phoneNumberId: settings.whatsappPhoneNumberId,
        accessToken: settings.whatsappAccessToken,
      },
      log.contact.phone,
      {
        body: log.campaign.message,
        mediaUrl: log.campaign.mediaUrl ?? undefined,
        mediaType: (log.campaign.mediaType as any) ?? undefined,
      }
    );

    if (result.success) {
      await prisma.campaignLog.update({
        where: { id: log.id },
        data: { status: "sent", messageId: result.messageId, attempts: { increment: 1 } },
      });
      sent++;
    } else {
      const attempts = log.attempts + 1;
      const giveUp = attempts >= env.sendMaxAttempts;
      await prisma.campaignLog.update({
        where: { id: log.id },
        // keep "queued" to retry on a later cron run until max attempts
        data: {
          status: giveUp ? "failed" : "queued",
          error: result.error,
          attempts,
        },
      });
      if (giveUp) failed++;
    }
  }

  for (const campaignId of touchedCampaigns) {
    await rollup(campaignId);
  }

  return { processed: logs.length, sent, failed };
}

export async function rollup(campaignId: string) {
  const grouped = await prisma.campaignLog.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  grouped.forEach((g) => (counts[g.status] = g._count._all));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pending = counts.queued ?? 0;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount: counts.sent ?? 0,
      deliveredCount: counts.delivered ?? 0,
      readCount: counts.read ?? 0,
      failedCount: counts.failed ?? 0,
      status: pending === 0 && total > 0 ? "completed" : "sending",
    },
  });
}
