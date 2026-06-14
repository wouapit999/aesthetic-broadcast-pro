import { NextRequest } from "next/server";
import axios from "axios";
import { z } from "zod";
import { env } from "@/server/env";
import { requireUser, handler, json } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  prompt: z.string().min(1),
  tone: z
    .enum(["friendly", "professional", "promotional", "luxury"])
    .default("friendly"),
  language: z.enum(["en", "fr", "pt", "sw", "ar"]).default("en"),
  businessName: z.string().optional(),
});

const LANG_LABEL: Record<string, string> = {
  en: "English",
  fr: "French",
  pt: "Portuguese",
  sw: "Swahili",
  ar: "Arabic",
};

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const { prompt, tone, language, businessName } = schema.parse(await req.json());

  if (env.anthropicApiKey) {
    try {
      const sys = `You are a marketing copywriter for an aesthetic / beauty business${
        businessName ? ` called ${businessName}` : ""
      }. Write a concise WhatsApp broadcast message in ${LANG_LABEL[language]}, ${tone} tone. Keep it under 600 characters, use at most 2 emojis, and include a clear call to action. Output only the message text.`;
      const r = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: env.anthropicModel,
          max_tokens: 400,
          system: sys,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "x-api-key": env.anthropicApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          timeout: 30000,
        }
      );
      const text = r.data?.content?.[0]?.text ?? "";
      return json({ message: text.trim(), source: "anthropic" });
    } catch {
      /* fall through to local */
    }
  }

  const greeting: Record<string, string> = {
    en: "Hello",
    fr: "Bonjour",
    pt: "Olá",
    sw: "Habari",
    ar: "مرحبا",
  };
  const cta: Record<string, string> = {
    en: "Book now and treat yourself! 💆‍♀️",
    fr: "Réservez maintenant et faites-vous plaisir ! 💆‍♀️",
    pt: "Reserve agora e cuide de você! 💆‍♀️",
    sw: "Weka nafasi sasa ujipendeze! 💆‍♀️",
    ar: "احجزي الآن ودللي نفسك! 💆‍♀️",
  };
  const message = `${greeting[language]}! ✨ ${prompt}${
    businessName ? ` — ${businessName}` : ""
  }. ${cta[language]}`;
  return json({ message, source: "local" });
});
