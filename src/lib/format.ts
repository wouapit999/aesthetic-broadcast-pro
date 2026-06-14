export function fmtDate(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-amber-100 text-amber-700",
  sending: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  queued: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-indigo-100 text-indigo-700",
  read: "bg-green-100 text-green-700",
};
