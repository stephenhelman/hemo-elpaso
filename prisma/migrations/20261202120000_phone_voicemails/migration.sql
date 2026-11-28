-- Voicemail on the phone line. Additive only. The audio stays at the phone provider; this table holds ids, codes, times
-- and the caller's number encrypted.
ALTER TYPE "EmailTemplateType" ADD VALUE 'VOICEMAIL_NOTICE';

ALTER TYPE "AuditAction" ADD VALUE 'VOICEMAIL_RECEIVED';
ALTER TYPE "AuditAction" ADD VALUE 'VOICEMAIL_PLAYED';
ALTER TYPE "AuditAction" ADD VALUE 'VOICEMAIL_HANDLED';
ALTER TYPE "AuditAction" ADD VALUE 'VOICEMAIL_SEARCHED';
ALTER TYPE "AuditAction" ADD VALUE 'VOICEMAIL_DELETED';

-- CreateTable
CREATE TABLE "phone_voicemails" (
    "id" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "recordingSid" TEXT,
    "mailbox" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "language" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "callerEnc" TEXT,
    "callerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "noticeSentAt" TIMESTAMP(3),
    "listenedAt" TIMESTAMP(3),
    "listenedById" TEXT,
    "handledAt" TIMESTAMP(3),
    "handledById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedReason" TEXT,
    "deletedById" TEXT,
    "deleteAttempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "phone_voicemails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phone_voicemails_callSid_key" ON "phone_voicemails"("callSid");

-- CreateIndex
CREATE UNIQUE INDEX "phone_voicemails_recordingSid_key" ON "phone_voicemails"("recordingSid");

-- CreateIndex
CREATE INDEX "phone_voicemails_callerHash_createdAt_idx" ON "phone_voicemails"("callerHash", "createdAt");

-- CreateIndex
CREATE INDEX "phone_voicemails_status_createdAt_idx" ON "phone_voicemails"("status", "createdAt");
