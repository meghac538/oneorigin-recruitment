-- CreateTable
CREATE TABLE "InterviewSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidate" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "notes" JSONB NOT NULL,
    "highlights" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "InterviewSubmission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_submissionId_key" ON "Report"("submissionId");
