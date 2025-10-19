import { Request, Response } from "express";
import { Logger } from "nestjs-pino";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { STATUS_CODE } from "@/constants";
import { IApiResponse } from "@/types/response.interface";
import { ResponseUtil } from "@/utils/response.util";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const traceId: string | undefined =
      (req.id as string) || (req.headers["x-request-id"] as string | undefined);

    // 简单确定状态码与业务码
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = status >= 400 ? Number(status) : STATUS_CODE.UNKNOWN_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.message
        : "Internal server error";

    // 记录结构化错误日志（不深入解析异常体）
    this.logger.error(
      {
        err: exception,
        code,
        status,
        method: req?.method,
        url: req?.url
      },
      message
    );

    // 仅返回统一结构，不泄露具体错误对象
    const responseBody: IApiResponse<never, unknown> = ResponseUtil.error(
      code,
      message
    );
    // 总是 200 返回，由客户端根据 ok/code 处理
    if (traceId) {
      res.setHeader("x-request-id", traceId);
    }
    httpAdapter.reply(ctx.getResponse(), responseBody, HttpStatus.OK);
  }
}
