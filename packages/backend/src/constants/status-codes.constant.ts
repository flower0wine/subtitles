// 业务状态码定义：0 表示成功，其它为失败
// 建议范围划分（示例）：
// 1xxx：通用错误；2xxx：鉴权/权限；3xxx：资源/参数；9xxx：外部依赖（如 Git、DB、Cache）
import { HttpStatus } from "@nestjs/common";

export const STATUS_CODE = {
  OK: 0,
  // 通用
  UNKNOWN_ERROR: 1,

  // 参数/资源
  INVALID_ARGUMENT: 1001,
  ALREADY_EXISTS: 1002,
  NOT_FOUND: 1003,

  // 鉴权/权限
  UNAUTHENTICATED: 2001,
  PERMISSION_DENIED: 2003,

  // 外部依赖
  GIT_CLONE_FAILED: 9001
} as const;

export type StatusCode =
  | (typeof STATUS_CODE)[keyof typeof STATUS_CODE]
  | HttpStatus;
