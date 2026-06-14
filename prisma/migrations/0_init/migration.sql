-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "profile_picture" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT,
    "business_description" TEXT,
    "business_category" TEXT DEFAULT 'Aesthetic',
    "business_address" TEXT,
    "business_phone" TEXT,
    "opening_hours" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#E91E63',
    "secondary_color" TEXT NOT NULL DEFAULT '#9C27B0',
    "accent_color" TEXT NOT NULL DEFAULT '#FF4081',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT NOT NULL DEFAULT 'Cameroon',
    "whatsapp_business_account_id" TEXT,
    "whatsapp_phone_number_id" TEXT,
    "whatsapp_access_token" TEXT,
    "whatsapp_webhook_token" TEXT,
    "whatsapp_connected" BOOLEAN NOT NULL DEFAULT false,
    "notify_campaign_completed" BOOLEAN NOT NULL DEFAULT true,
    "notify_campaign_failed" BOOLEAN NOT NULL DEFAULT true,
    "notify_new_contact" BOOLEAN NOT NULL DEFAULT false,
    "notify_automation" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gender" TEXT,
    "birthday" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL DEFAULT 'MARKETING',
    "body" TEXT NOT NULL,
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "media_url" TEXT,
    "media_type" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "audience_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "segment_id" TEXT,
    "template_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "message_id" TEXT,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "template_id" TEXT,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_id_key" ON "settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_phone_key" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "campaign_logs_campaign_id_idx" ON "campaign_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_logs_message_id_idx" ON "campaign_logs"("message_id");

-- CreateIndex
CREATE INDEX "campaign_logs_status_idx" ON "campaign_logs"("status");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

