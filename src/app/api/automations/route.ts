import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  trigger: z.enum(["contact_created", "birthday", "tag_added", "no_reply"]),
  config: z.record(z.any()).optional().default({}),
  templateId: z.string().optional().nullable(),
  delayHours: z.number().int().min(0).optional().default(0),
  enabled: z.boolean().optional().default(true),
});

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const items = await prisma.automation.findMany({ orderBy: { createdAt: "desc" } });
  return json({ items });
});

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const data = schema.parse(await req.json());
  const a = await prisma.automation.create({ data });
  return json(a, 201);
});
