import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";
import { testConnection } from "@/server/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const u = requireUser(req);
  const settings = await prisma.settings.findUnique({ where: { userId: u.sub } });
  if (!settings?.whatsappPhoneNumberId || !settings?.whatsappAccessToken) {
    return json({ ok: false, detail: "WhatsApp credentials not configured" }, 400);
  }
  const result = await testConnection({
    phoneNumberId: settings.whatsappPhoneNumberId,
    accessToken: settings.whatsappAccessToken,
  });
  await prisma.settings.update({
    where: { userId: u.sub },
    data: { whatsappConnected: result.ok },
  });
  return json(result);
});
