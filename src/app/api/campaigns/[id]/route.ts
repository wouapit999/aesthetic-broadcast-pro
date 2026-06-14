import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json, HttpError } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  mediaUrl: z.string().url().nullable(),
  mediaType: z.enum(["image", "video", "document"]).nullable(),
  audience: z.enum(["all", "tags", "segment"]),
  audienceTags: z.array(z.string()),
  segmentId: z.string().nullable(),
  templateId: z.string().nullable(),
  scheduledAt: z.string().datetime().nullable(),
});

type Ctx = { params: { id: string } };

export const GET = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { segment: true, template: true },
  });
  if (!campaign) throw new HttpError(404, "Campaign not found");

  const logs = await prisma.campaignLog.findMany({
    where: { campaignId: campaign.id },
    include: { contact: { select: { name: true, phone: true } } },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
  return json({ campaign, logs });
});

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  const data = schema.partial().parse(await req.json());
  const update: Record<string, unknown> = { ...data };
  if (data.scheduledAt !== undefined)
    update.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: update,
  });
  return json(campaign);
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  await prisma.campaign.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
});
