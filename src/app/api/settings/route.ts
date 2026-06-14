import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { env } from "@/server/env";
import { requireUser, handler, json, JwtPayload } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOrCreate(userId: string) {
  let settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) settings = await prisma.settings.create({ data: { userId } });
  return settings;
}

function baseUrl(req: NextRequest): string {
  if (env.publicBaseUrl) return env.publicBaseUrl;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function decorate(req: NextRequest, settings: Record<string, any>) {
  return {
    ...settings,
    webhookCallbackUrl: `${baseUrl(req)}/api/whatsapp/webhook`,
    whatsappAccessToken: settings.whatsappAccessToken
      ? `••••••••${String(settings.whatsappAccessToken).slice(-4)}`
      : null,
  };
}

export const GET = handler(async (req: NextRequest) => {
  const u: JwtPayload = requireUser(req);
  const settings = await getOrCreate(u.sub);
  return json(decorate(req, settings as any));
});

const schema = z.object({
  businessName: z.string().nullable().optional(),
  businessDescription: z.string().nullable().optional(),
  businessCategory: z.string().nullable().optional(),
  businessAddress: z.string().nullable().optional(),
  businessPhone: z.string().nullable().optional(),
  openingHours: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["en", "fr", "pt", "sw", "ar"]).optional(),
  country: z.string().optional(),
  whatsappBusinessAccountId: z.string().nullable().optional(),
  whatsappPhoneNumberId: z.string().nullable().optional(),
  whatsappAccessToken: z.string().nullable().optional(),
  whatsappWebhookToken: z.string().nullable().optional(),
  notifyCampaignCompleted: z.boolean().optional(),
  notifyCampaignFailed: z.boolean().optional(),
  notifyNewContact: z.boolean().optional(),
  notifyAutomation: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export const PUT = handler(async (req: NextRequest) => {
  const u = requireUser(req);
  await getOrCreate(u.sub);
  const data = schema.parse(await req.json());

  const update: Record<string, unknown> = { ...data };
  if (
    typeof update.whatsappAccessToken === "string" &&
    update.whatsappAccessToken.startsWith("••")
  ) {
    delete update.whatsappAccessToken;
  }

  const settings = await prisma.settings.update({
    where: { userId: u.sub },
    data: update,
  });
  return json(decorate(req, settings as any));
});
