/*
  Warnings:

  - You are about to drop the column `userId` on the `todos` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `todos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `todos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "todos" DROP CONSTRAINT "todos_userId_fkey";

-- DropIndex
DROP INDEX "todos_userId_idx";

-- AlterTable
ALTER TABLE "todos" DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "todos_organizationId_idx" ON "todos"("organizationId");

-- CreateIndex
CREATE INDEX "todos_createdBy_idx" ON "todos"("createdBy");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
