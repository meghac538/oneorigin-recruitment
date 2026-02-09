-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterviewLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "maxSubmissions" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "InterviewLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterviewLink" ("candidateEmail", "candidateName", "createdAt", "expiresAt", "id", "level", "mode", "role", "token", "userId") SELECT "candidateEmail", "candidateName", "createdAt", "expiresAt", "id", "level", "mode", "role", "token", "userId" FROM "InterviewLink";
DROP TABLE "InterviewLink";
ALTER TABLE "new_InterviewLink" RENAME TO "InterviewLink";
CREATE UNIQUE INDEX "InterviewLink_token_key" ON "InterviewLink"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
