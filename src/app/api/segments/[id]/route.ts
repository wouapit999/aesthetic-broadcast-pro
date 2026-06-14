import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ruleSchema = z.object({
  combinator: z.enum(["AND", "OR"]).optional().default("AND"),
  conditions: z
    .array(
      z.object({
        field: z.enum(["tags", "gender", "name", "notes", "phone"]),
        op: z.enum(["equals", "contains", "not_contains", "starts_with"]),
        value: z.string(),
      })
    )
    .default([]),
});

const schema = z.object({ name: z.string().min(1), rules: ruleSchema });

type Ctx = { params: { id: string } };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  const data = schema.partial().parse(await req.json());
  const segment = await prisma.segment.update({
    where: { id: params.id },
    data,
  });
  return json(segment);
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  await prisma.segment.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
});
