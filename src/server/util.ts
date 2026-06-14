export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned.replace(/^0+/, "")}`;
}
