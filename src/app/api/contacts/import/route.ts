import { NextRequest } from "next/server";
import Papa from "papaparse";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { requireUser, handler, json } from "@/server/auth";
import { normalizePhone } from "@/server/util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ csv: z.string().min(1) });

export const POST = handler(async (req: NextRequest) => {
  requireUser(req);
  const { csv } = schema.parse(await req.json());

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  let created = 0;
  let duplicates = 0;
  let invalid = 0;
  const errors: string[] = [];

  for (const row of parsed.data) {
    const name = row.name?.trim();
    const rawPhone = (row.phone ?? row.phonenumber ?? row.mobile ?? "").trim();
    if (!name || !rawPhone) {
      invalid++;
      continue;
    }
    const phone = normalizePhone(rawPhone);
    const tags = (row.tags ?? "")
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await prisma.contact.create({
        data: {
          name,
          phone,
          tags,
          gender: row.gender?.trim() || null,
          birthday: row.birthday ? new Date(row.birthday) : null,
          notes: row.notes?.trim() || null,
        },
      });
      created++;
    } catch (e: any) {
      if (String(e?.message).includes("Unique constraint")) duplicates++;
      else {
        invalid++;
        if (errors.length < 10) errors.push(`${name}: ${e?.message}`);
      }
    }
  }

  return json({ created, duplicates, invalid, total: parsed.data.length, errors });
});
