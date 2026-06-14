// Server-only env access. Next.js loads .env automatically.
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@aesthetic.shop",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  sendBatchSize: parseInt(process.env.SEND_BATCH_SIZE ?? "50", 10),
  sendMaxAttempts: parseInt(process.env.SEND_MAX_ATTEMPTS ?? "3", 10),
  cronSecret: process.env.CRON_SECRET ?? "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v20.0",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
  publicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "",
};
