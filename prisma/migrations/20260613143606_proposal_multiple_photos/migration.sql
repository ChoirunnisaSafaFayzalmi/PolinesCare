/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `Proposal` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Sosial',
    "targetAmount" INTEGER,
    "proposedBy" TEXT NOT NULL,
    "proposerName" TEXT,
    "proposerEmail" TEXT,
    "proposerPhone" TEXT,
    "proposerAddress" TEXT,
    "campaignLocation" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "officialDocUrl" TEXT,
    "photoUrls" TEXT,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "resubmittedFrom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kejelasanTujuan" INTEGER NOT NULL DEFAULT 0,
    "kelayakanAnggaran" INTEGER NOT NULL DEFAULT 0,
    "urgensi" INTEGER NOT NULL DEFAULT 0,
    "keterkaitanKampus" INTEGER NOT NULL DEFAULT 0,
    "kontribusiSosial" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Proposal_proposedBy_fkey" FOREIGN KEY ("proposedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proposal" ("campaignLocation", "category", "createdAt", "description", "endDate", "id", "kejelasanTujuan", "kelayakanAnggaran", "keterkaitanKampus", "kontribusiSosial", "officialDocUrl", "proposedBy", "proposerAddress", "proposerEmail", "proposerName", "proposerPhone", "rejectionReason", "resubmittedFrom", "startDate", "status", "targetAmount", "title", "updatedAt", "urgensi", "votesCount") SELECT "campaignLocation", "category", "createdAt", "description", "endDate", "id", "kejelasanTujuan", "kelayakanAnggaran", "keterkaitanKampus", "kontribusiSosial", "officialDocUrl", "proposedBy", "proposerAddress", "proposerEmail", "proposerName", "proposerPhone", "rejectionReason", "resubmittedFrom", "startDate", "status", "targetAmount", "title", "updatedAt", "urgensi", "votesCount" FROM "Proposal";
DROP TABLE "Proposal";
ALTER TABLE "new_Proposal" RENAME TO "Proposal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
