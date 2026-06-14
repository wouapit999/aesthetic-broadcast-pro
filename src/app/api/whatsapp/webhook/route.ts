import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { rollup } from "@/server/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook verification (Meta calls GET when you save the callback URL).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const settings = await prisma.settings.findFirst({
    where: { whatsappWebhookToken: { not: null } },
  });

  if (mode === "subscribe" && token && token === settings?.whatsappWebhookToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Delivery/read receipts + inbound replies.
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  // Acknowledge fast, then process.
  try {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};

        for (const status of value.statuses ?? []) {
          const messageId: string | undefined = status.id;
          const newStatus: string = status.status;
          if (!messageId) continue;
          const log = await prisma.campaignLog.findFirst({ where: { messageId } });
          if (!log) continue;
          await prisma.campaignLog.update({
            where: { id: log.id },
            data: { status: newStatus, error: status.errors?.[0]?.title ?? undefined },
          });
          await rollup(log.campaignId);
        }

        for (const msg of value.messages ?? []) {
          const from: string | undefined = msg.from;
          if (!from) continue;
          const contact = await prisma.contact.findFirst({
            where: { phone: { contains: from.slice(-9) } },
          });
          if (!contact) continue;
          const log = await prisma.campaignLog.findFirst({
            where: { contactId: contact.id },
            orderBy: { updatedAt: "desc" },
          });
          if (log) {
            await prisma.campaign.update({
              where: { id: log.campaignId },
              data: { replyCount: { increment: 1 } },
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[webhook] processing error", e);
  }

  return new NextResponse("OK", { status: 200 });
}
