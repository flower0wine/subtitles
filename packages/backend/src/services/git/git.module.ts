import { Module } from "@nestjs/common";
import { GitController } from "@/services/git/git.controller";
import { GitService } from "@/services/git/git.service";

@Module({
  controllers: [GitController],
  providers: [GitService],
  exports: [GitService]
})
export class GitModule {}
