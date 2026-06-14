import { prisma } from "./prisma";

export interface SegmentCondition {
  field: "tags" | "gender" | "name" | "notes" | "phone";
  op: "equals" | "contains" | "not_contains" | "starts_with";
  value: string;
}

export interface SegmentRules {
  combinator?: "AND" | "OR";
  conditions?: SegmentCondition[];
}

function conditionToWhere(c: SegmentCondition): Record<string, unknown> {
  switch (c.field) {
    case "tags":
      if (c.op === "not_contains") return { NOT: { tags: { has: c.value } } };
      return { tags: { has: c.value } };
    case "gender":
      return { gender: { equals: c.value, mode: "insensitive" } };
    default: {
      if (c.op === "equals")
        return { [c.field]: { equals: c.value, mode: "insensitive" } };
      if (c.op === "starts_with")
        return { [c.field]: { startsWith: c.value, mode: "insensitive" } };
      return { [c.field]: { contains: c.value, mode: "insensitive" } };
    }
  }
}

export function rulesToWhere(rules: SegmentRules): Record<string, unknown> {
  const conditions = rules?.conditions ?? [];
  if (conditions.length === 0) return {};
  const clauses = conditions.map(conditionToWhere);
  return rules.combinator === "OR" ? { OR: clauses } : { AND: clauses };
}

export async function countSegmentContacts(rules: SegmentRules) {
  return prisma.contact.count({ where: rulesToWhere(rules) });
}

export async function resolveSegmentContacts(rules: SegmentRules) {
  return prisma.contact.findMany({ where: rulesToWhere(rules) });
}

export async function resolveCampaignAudience(campaign: {
  audience: string;
  audienceTags: string[];
  segmentId: string | null;
}) {
  if (campaign.audience === "all") return prisma.contact.findMany();
  if (campaign.audience === "tags" && campaign.audienceTags.length > 0) {
    return prisma.contact.findMany({
      where: { tags: { hasSome: campaign.audienceTags } },
    });
  }
  if (campaign.audience === "segment" && campaign.segmentId) {
    const segment = await prisma.segment.findUnique({
      where: { id: campaign.segmentId },
    });
    if (!segment) return [];
    return resolveSegmentContacts((segment.rules as SegmentRules) ?? {});
  }
  return [];
}
