-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthId" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthPicture" TEXT;
ALTER TABLE "User" ADD COLUMN "oauthProvider" TEXT;

-- CreateIndex
CREATE INDEX "User_oauthProvider_oauthId_idx" ON "User"("oauthProvider", "oauthId");
