-- CreateIndex
CREATE INDEX "club_posts_authorId_idx" ON "club_posts"("authorId");

-- AddForeignKey
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
