-- DropForeignKey
ALTER TABLE "communication_logs" DROP CONSTRAINT "communication_logs_boardRoleId_fkey";

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_boardRoleId_fkey" FOREIGN KEY ("boardRoleId") REFERENCES "board_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
