import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json, HttpError } from "@/server/auth";
import { resolveCampaignAudience } from "@/server/segment";
import { dispatchQueued } from "@/server/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  requireUser(req);
  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new HttpError(404, "Campaign not found");
  if (campaign.status === "sending")
    throw new HttpError(409, "Campaign is already sending");

  const recipients = await resolveCampaignAudience(campaign);
  if (recipients.length === 0) throw new HttpError(400, "Audience is empty");

  await prisma.campaignLog.deleteMany({ where: { campaignId: campaign.id } });
  await prisma.campaignLog.createMany({
    data: recipients.map((c) => ({
      campaignId: campaign.id,
      contactId: c.id,
      status: "queued",
    })),
  });

  const scheduledInFuture =
    !!campaign.scheduledAt &&
    new Date(campaign.scheduledAt).getTime() > Date.now();

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      // Scheduled campaigns stay "scheduled" until the cron promotes them when due.
      status: scheduledInFuture ? "scheduled" : "sending",
      totalRecipients: recipients.length,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
    },
  });

  // Best-effort: send the first batch immediately; the scheduled function
  // (/api/cron/dispatch) drains the rest minute by minute.
  let firstBatch = { processed: 0, sent: 0, failed: 0 };
  if (!scheduledInFuture) firstBatch = await dispatchQueued();

  return json({
    queued: recipients.length,
    firstBatch,
    scheduled: scheduledInFuture,
  });
});
