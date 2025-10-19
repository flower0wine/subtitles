import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import { CloneRequestDto } from "@/services/git/dto/clone.dto";
import { GitService } from "@/services/git/git.service";
import {
  CloneAlreadyExistsExample,
  CloneFailedExample,
  CloneInvalidArgumentExample,
  CloneOkExample
} from "@/services/git/swagger/git.examples";
import { CloneResponseVo } from "@/services/git/vo/clone.vo";
import { getBadRequestContent } from "@/services/swagger.common";

@Controller("git")
@ApiTags("GitClone")
export class GitController {
  constructor(private readonly gitService: GitService) {}

  @Post("clone")
  @ApiOperation({
    summary: "克隆 Git 仓库",
    description:
      "克隆指定的 Git 仓库到服务器本地目录。成功时返回目标路径与目录名。"
  })
  @ApiBody({ type: CloneRequestDto, required: true })
  @ApiOkResponse({
    description: "克隆成功后的响应格式",
    type: CloneResponseVo,
    examples: { CloneOkExample } as any
  })
  @ApiBadRequestResponse({
    description: "请求参数缺失/非法，目录已存在或克隆失败",
    content: getBadRequestContent({
      invalidArgument: CloneInvalidArgumentExample,
      alreadyExists: CloneAlreadyExistsExample,
      cloneFailed: CloneFailedExample
    })
  })
  async clone(@Body() body: CloneRequestDto) {
    return await this.gitService.cloneRepo(body);
  }
}
