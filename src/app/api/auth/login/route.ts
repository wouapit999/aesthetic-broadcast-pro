import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { signToken, handler, json, HttpError } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = handler(async (req: NextRequest) => {
  const { email, password } = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
