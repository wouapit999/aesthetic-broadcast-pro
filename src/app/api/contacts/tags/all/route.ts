import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const contacts = await prisma.contact.findMany({ select: { tags: true } });
  const set = new Set<string>();
  contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
  return json({ tags: Array.from(set).sort() });
});
