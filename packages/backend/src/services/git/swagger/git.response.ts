import { HttpException, HttpStatus } from "@nestjs/common";
import { STATUS_CODE } from "@/constants";

export const GitResponseKeys = {
  OK: "OK",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CLONE_FAILED: "CLONE_FAILED"
} as const;

export const GIT_RESPONSES = {
  [GitResponseKeys.OK]: {
    code: STATUS_CODE.OK,
    http: HttpStatus.OK,
    message: "克隆成功"
  },
  [GitResponseKeys.INVALID_ARGUMENT]: {
    code: STATUS_CODE.INVALID_ARGUMENT,
    http: HttpStatus.BAD_REQUEST,
    message: "缺少有效的仓库链接 url"
  },
  [GitResponseKeys.ALREADY_EXISTS]: {
    code: STATUS_CODE.ALREADY_EXISTS,
    http: HttpStatus.BAD_REQUEST,
    message: "目标目录已存在"
  },
  [GitResponseKeys.CLONE_FAILED]: {
    code: STATUS_CODE.GIT_CLONE_FAILED,
    http: HttpStatus.BAD_REQUEST,
    message: "克隆失败"
  }
} as const;

export type GitResponseKey = keyof typeof GitResponseKeys;

export function gitResponse(
  key: GitResponseKey,
  message?: string
): HttpException {
  const spec = GIT_RESPONSES[key];
  const msg = message ?? spec.message;
  return new HttpException({ code: spec.code, message: msg }, spec.http);
}
