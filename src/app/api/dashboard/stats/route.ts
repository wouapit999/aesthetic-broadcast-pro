import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);

  const [contacts, segments, campaigns, templates, agg, recent] = await Promise.all([
    prisma.contact.count(),
    prisma.segment.count(),
    prisma.campaign.count(),
    prisma.template.count(),
    prisma.campaign.aggregate({
      _sum: {
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
        replyCount: true,
      },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        deliveredCount: true,
        readCount: true,
        createdAt: true,
      },
    }),
  ]);

  const sent = agg._sum.sentCount ?? 0;
  const delivered = agg._sum.deliveredCount ?? 0;
  const read = agg._sum.readCount ?? 0;

  return json({
    counts: { contacts, segments, campaigns, templates },
    messaging: {
      sent,
      delivered,
      read,
      failed: agg._sum.failedCount ?? 0,
      replies: agg._sum.replyCount ?? 0,
      deliveryRate: sent ? Math.round((delivered / sent) * 100) : 0,
      readRate: delivered ? Math.round((read / delivered) * 100) : 0,
    },
    recentCampaigns: recent,
  });
});
