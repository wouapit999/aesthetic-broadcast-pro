import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  mediaUrl: z.string().url().optional().nullable(),
  mediaType: z.enum(["image", "video", "document"]).optional().nullable(),
  audience: z.enum(["all", "tags", "segment"]).default("all"),
  audienceTags: z.array(z.string()).optional().default([]),
  segmentId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const items = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { segment: { select: { name: true } } },
  });
  return json({ items });
});

export const POST = handler(async (req: NextRequest) => {
  const u = requireUser(req);
  const data = schema.parse(await req.json());
  const status = data.scheduledAt ? "scheduled" : "draft";
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      message: data.message,
      mediaUrl: data.mediaUrl ?? null,
      mediaType: data.mediaType ?? null,
      audience: data.audience,
      audienceTags: data.audienceTags,
      segmentId: data.segmentId ?? null,
      templateId: data.templateId ?? null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status,
      createdById: u.sub,
    },
  });
  return json(campaign, 201);
});
