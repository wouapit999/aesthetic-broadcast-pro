import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json, HttpError } from "@/server/auth";
import { normalizePhone } from "@/server/util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  tags: z.array(z.string()).optional().default([]),
  gender: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const GET = handler(async (req: NextRequest) => {
  requireUser(req);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const tag = searchParams.get("tag");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(200, parseInt(searchParams.get("pageSize") ?? "50", 10));

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  if (tag) where.tags = { has: tag };

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return json({ items, total, page, pageSize });
});

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const data = schema.parse(await req.json());
  const phone = normalizePhone(data.phone);
  const existing = await prisma.contact.findUnique({ where: { phone } });
  if (existing) throw new HttpError(409, "A contact with this phone already exists");

  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      phone,
      tags: data.tags,
      gender: data.gender ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      notes: data.notes ?? null,
    },
  });
  return json(contact, 201);
});
