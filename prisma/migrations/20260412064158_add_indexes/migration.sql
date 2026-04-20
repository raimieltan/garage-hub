-- DropIndex
DROP INDEX "posts_createdAt_idx";

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "events"("organizerId");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "posts_createdAt_id_idx" ON "posts"("createdAt", "id");
