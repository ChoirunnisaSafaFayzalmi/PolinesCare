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
    "paymentMethods" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "uniqueCode" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dropOffLocation" TEXT,
    "proposalId" TEXT,
    CONSTRAINT "Campaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Campaign_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("category", "collectedAmount", "createdAt", "createdBy", "description", "dropOffLocation", "endDate", "id", "images", "isPublic", "isUrgent", "location", "paymentMethods", "startDate", "status", "targetAmount", "title", "uniqueCode", "updatedAt") SELECT "category", "collectedAmount", "createdAt", "createdBy", "description", "dropOffLocation", "endDate", "id", "images", "isPublic", "isUrgent", "location", "paymentMethods", "startDate", "status", "targetAmount", "title", "uniqueCode", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE UNIQUE INDEX "Campaign_proposalId_key" ON "Campaign"("proposalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
