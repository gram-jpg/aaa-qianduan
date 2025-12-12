-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyNameEn" TEXT NOT NULL,
    "companyNameTh" TEXT NOT NULL,
    "shortName" TEXT,
    "addressEn" TEXT NOT NULL,
    "addressTh" TEXT NOT NULL,
    "mailingAddress" TEXT,
    "taxId" TEXT NOT NULL,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccount" TEXT,
    "bankBranchCode" TEXT,
    "createdAt" BIGINT NOT NULL
);
