-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FRESHY', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "UserGroup" AS ENUM ('G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'SCAN_QR', 'MANUAL_SEARCH', 'GIVE_POINTS', 'UPDATE_USER');

-- CreateTable
CREATE TABLE "app_user" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_no" VARCHAR(20),
    "firstname" VARCHAR(255) NOT NULL,
    "lastname" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "user_code" VARCHAR(4) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FRESHY',
    "group" "UserGroup" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" SERIAL NOT NULL,
    "giver_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'SUCCESS',
    "target_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(0) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_user_code_key" ON "app_user"("user_code");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
