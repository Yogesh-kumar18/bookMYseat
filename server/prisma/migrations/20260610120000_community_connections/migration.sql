-- CreateEnum
CREATE TYPE "CommunityConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "CommunityConnection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "CommunityConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityConnection_requesterId_receiverId_key" ON "CommunityConnection"("requesterId", "receiverId");

-- CreateIndex
CREATE INDEX "CommunityConnection_receiverId_status_idx" ON "CommunityConnection"("receiverId", "status");

-- CreateIndex
CREATE INDEX "CommunityConnection_requesterId_status_idx" ON "CommunityConnection"("requesterId", "status");

-- AddForeignKey
ALTER TABLE "CommunityConnection" ADD CONSTRAINT "CommunityConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityConnection" ADD CONSTRAINT "CommunityConnection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
