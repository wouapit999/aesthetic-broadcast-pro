import axios from "axios";
import { env } from "./env";

export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function graphUrl(phoneNumberId: string): string {
  return `https://graph.facebook.com/${env.whatsappApiVersion}/${phoneNumberId}/messages`;
}

export async function sendWhatsAppMessage(
  creds: WhatsAppCredentials,
  to: string,
  options: {
    body?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video" | "document";
  }
): Promise<SendResult> {
  const phone = to.replace(/[^\d]/g, "");

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
  };

  if (options.mediaUrl && options.mediaType) {
    payload.type = options.mediaType;
    payload[options.mediaType] = {
      link: options.mediaUrl,
      ...(options.body ? { caption: options.body } : {}),
    };
  } else {
    payload.type = "text";
    payload.text = { preview_url: true, body: options.body ?? "" };
  }

  try {
    const res = await axios.post(graphUrl(creds.phoneNumberId), payload, {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    return { success: true, messageId: res.data?.messages?.[0]?.id };
  } catch (err: any) {
    const apiError =
      err?.response?.data?.error?.message ?? err?.message ?? "Unknown error";
    return { success: false, error: apiError };
  }
}

export async function testConnection(
  creds: WhatsAppCredentials
): Promise<{ ok: boolean; detail?: string; verifiedName?: string }> {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${env.whatsappApiVersion}/${creds.phoneNumberId}`,
      {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
        params: { fields: "verified_name,display_phone_number,quality_rating" },
        timeout: 15000,
      }
    );
    return {
      ok: true,
      verifiedName: res.data?.verified_name,
      detail: res.data?.display_phone_number,
    };
  } catch (err: any) {
    const apiError =
      err?.response?.data?.error?.message ?? err?.message ?? "Unknown error";
    return { ok: false, detail: apiError };
  }
}
