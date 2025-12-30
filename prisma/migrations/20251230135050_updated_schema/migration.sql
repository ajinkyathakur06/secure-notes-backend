-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_note_id_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_note_id_fkey";

-- DropForeignKey
ALTER TABLE "UserNoteMeta" DROP CONSTRAINT "UserNoteMeta_note_id_fkey";

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("note_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("note_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNoteMeta" ADD CONSTRAINT "UserNoteMeta_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Notes"("note_id") ON DELETE CASCADE ON UPDATE CASCADE;
