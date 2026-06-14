import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser, handler, json } from "@/server/auth";
import { countSegmentContacts } from "@/server/segment";

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

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const body = await req.json();
  const rules = ruleSchema.parse(body.rules);
  const count = await countSegmentContacts(rules);
  return json({ count });
});
