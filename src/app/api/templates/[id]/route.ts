import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  language: z.string(),
  category: z.string(),
  body: z.string().min(1),
  mediaUrl: z.string().url().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, ctx: Ctx) => {
  requireUser(req);
  const { id } = await ctx.params;
  const data = schema.partial().parse(await req.json());
  const t = await prisma.template.update({ where: { id }, data });
  return json(t);
});

export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  requireUser(req);
  const { id } = await ctx.params;
  await prisma.template.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
