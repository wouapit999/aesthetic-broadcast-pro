import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";
import { normalizePhone } from "@/server/util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  tags: z.array(z.string()),
  gender: z.string().nullable(),
  birthday: z.string().nullable(),
  notes: z.string().nullable(),
});

type Ctx = { params: { id: string } };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  const data = schema.partial().parse(await req.json());
  const update: Record<string, unknown> = { ...data };
  if (data.phone) update.phone = normalizePhone(data.phone);
  if (data.birthday !== undefined)
    update.birthday = data.birthday ? new Date(data.birthday) : null;

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: update,
  });
  return json(contact);
});

export const DELETE = handler(async (req: NextRequest, { params }: Ctx) => {
  requireUser(req);
  await prisma.contact.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
});
