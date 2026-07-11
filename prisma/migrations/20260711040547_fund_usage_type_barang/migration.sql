-- AlterTable
ALTER TABLE "FundUsage" ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "itemQuantity" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'uang',
ALTER COLUMN "amount" DROP NOT NULL;
