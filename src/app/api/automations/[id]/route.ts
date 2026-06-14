import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  trigger: z.enum(["contact_created", "birthday", "tag_added", "no_reply"]),
  config: z.record(z.any()),
  templateId: z.string().nullable(),
  delayHours: z.number().int().min(0),
  enabled: z.boolean(),
});

type Ctx = { params: { id: string } };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  const data = schema.partial().parse(await req.json());
  const a = await prisma.automation.update({ where: { id: params.id }, data });
  return json(a);
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  await prisma.automation.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
});
