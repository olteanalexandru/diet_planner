-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "targetUserId" TEXT;

-- CreateIndex
CREATE INDEX "Activity_targetUserId_idx" ON "Activity"("targetUserId");
