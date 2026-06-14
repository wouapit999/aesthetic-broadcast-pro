import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json, HttpError } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["delete", "addTag", "removeTag"]),
  ids: z.array(z.string()).min(1),
  tag: z.string().optional(),
});

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const { action, ids, tag } = schema.parse(await req.json());

  if (action === "delete") {
    const r = await prisma.contact.deleteMany({ where: { id: { in: ids } } });
    return json({ affected: r.count });
  }
  if (!tag) throw new HttpError(400, "tag is required");

  const contacts = await prisma.contact.findMany({ where: { id: { in: ids } } });
  await Promise.all(
    contacts.map((c) => {
      const tags =
        action === "addTag"
          ? Array.from(new Set([...c.tags, tag]))
          : c.tags.filter((t) => t !== tag);
      return prisma.contact.update({ where: { id: c.id }, data: { tags } });
    })
  );
  return json({ affected: contacts.length });
});
