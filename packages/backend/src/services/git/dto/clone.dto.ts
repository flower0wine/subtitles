import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CloneRequestDto {
  @ApiProperty({
    description:
      "Git 仓库地址，支持 https 与 git 协议。例如：https://github.com/owner/repo.git 或 git@github.com:owner/repo.git",
    example: "https://github.com/flower0wine/nice.git"
  })
  url!: string;

  @ApiPropertyOptional({
    description:
      "克隆到的目录名。若不传，将根据仓库名自动推导（去掉 .git 后缀）",
    example: "nice"
  })
  dirName?: string;
}
