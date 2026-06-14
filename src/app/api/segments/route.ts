import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";
import { countSegmentContacts, SegmentRules } from "@/server/segment";

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

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const segments = await prisma.segment.findMany({ orderBy: { createdAt: "desc" } });
  const withCounts = await Promise.all(
    segments.map(async (s) => ({
      ...s,
      contactCount: await countSegmentContacts(s.rules as SegmentRules),
    }))
  );
  return json({ items: withCounts });
});

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const data = schema.parse(await req.json());
  const segment = await prisma.segment.create({
    data: { name: data.name, rules: data.rules },
  });
  return json(segment, 201);
});
