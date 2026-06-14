import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json, HttpError } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(async (req: NextRequest) => {
  const u = requireUser(req);
  const user = await prisma.user.findUnique({
    where: { id: u.sub },
    select: {
      id: true,
      email: true,
      role: true,
      profilePicture: true,
      createdAt: true,
    },
  });
  return json({ user });
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  currentPassword: z.string().optional(),
  profilePicture: z.string().optional(),
});

export const PUT = handler(async (req: NextRequest) => {
  const u = requireUser(req);
  const data = updateSchema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id: u.sub } });
  if (!user) throw new HttpError(404, "User not found");

  const update: Record<string, unknown> = {};
  if (data.email) update.email = data.email;
  if (data.profilePicture !== undefined) update.profilePicture = data.profilePicture;
  if (data.password) {
    const ok = await bcrypt.compare(data.currentPassword ?? "", user.passwordHash);
    if (!ok) throw new HttpError(400, "Current password is incorrect");
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: update,
    select: { id: true, email: true, role: true, profilePicture: true },
  });
  return json({ user: updated });
});
