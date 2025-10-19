import { ApiProperty } from "@nestjs/swagger";

export class CloneResponseVo {
  @ApiProperty({
    description: "克隆后的目标绝对路径",
    example: "C:/Users/<user>/nice-repos/nice"
  })
  targetPath!: string;

  @ApiProperty({
    description: "克隆目录名",
    example: "nice"
  })
  dirName!: string;
}
