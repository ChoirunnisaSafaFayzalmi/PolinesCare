/*
  Warnings:

  - You are about to drop the column `image` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `dropOffLocation` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `Donation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetAmount" INTEGER NOT NULL,
    "collectedAmount" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "images" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "uniqueCode" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dropOffLocation" TEXT,
    CONSTRAINT "Campaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("category", "collectedAmount", "createdAt", "createdBy", "description", "endDate", "id", "isUrgent", "location", "startDate", "status", "targetAmount", "title", "uniqueCode", "updatedAt") SELECT "category", "collectedAmount", "createdAt", "createdBy", "description", "endDate", "id", "isUrgent", "location", "startDate", "status", "targetAmount", "title", "uniqueCode", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE TABLE "new_Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'uang',
    "paymentMethod" TEXT NOT NULL DEFAULT 'transfer',
    "proofUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "itemName" TEXT,
    "itemQuantity" INTEGER,
    "senderAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Donation" ("amount", "campaignId", "createdAt", "donorEmail", "donorName", "donorPhone", "id", "itemName", "itemQuantity", "message", "paymentMethod", "proofUrl", "senderAddress", "status", "type", "updatedAt", "userId") SELECT "amount", "campaignId", "createdAt", "donorEmail", "donorName", "donorPhone", "id", "itemName", "itemQuantity", "message", "paymentMethod", "proofUrl", "senderAddress", "status", "type", "updatedAt", "userId" FROM "Donation";
DROP TABLE "Donation";
ALTER TABLE "new_Donation" RENAME TO "Donation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
