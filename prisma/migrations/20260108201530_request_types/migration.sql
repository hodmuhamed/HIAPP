-- CreateEnum
CREATE TYPE "RequestTypeVisibilityPolicy" AS ENUM ('ADMIN_ONLY', 'DIRECT_PARTICIPANTS', 'ADMIN_AND_HANDLERS', 'TEAM_PUBLIC');

-- CreateTable
CREATE TABLE "RequestType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "visibilityPolicy" "RequestTypeVisibilityPolicy" NOT NULL,
    "requiresRecipient" BOOLEAN NOT NULL DEFAULT false,
    "requiresAssignment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTypeAssignee" (
    "id" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestTypeAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestType_slug_key" ON "RequestType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RequestTypeAssignee_typeId_userId_key" ON "RequestTypeAssignee"("typeId", "userId");

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "recipientId" TEXT,
ADD COLUMN     "typeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "RequestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTypeAssignee" ADD CONSTRAINT "RequestTypeAssignee_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "RequestType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTypeAssignee" ADD CONSTRAINT "RequestTypeAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
