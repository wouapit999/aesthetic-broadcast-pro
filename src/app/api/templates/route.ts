import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  language: z.string().default("en"),
  category: z.string().default("MARKETING"),
  body: z.string().min(1),
  mediaUrl: z.string().url().optional().nullable(),
});

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const items = await prisma.template.findMany({ orderBy: { createdAt: "desc" } });
  return json({ items });
});

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const data = schema.parse(await req.json());
  const t = await prisma.template.create({ data });
  return json(t, 201);
});
