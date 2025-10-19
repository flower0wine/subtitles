import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { LoggerModule } from "nestjs-pino";
import { Module } from "@nestjs/common";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { GitModule } from "@/services/git/git.module";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: Request, res: Response) => {
          const hdr = req.headers["x-request-id"] as string | undefined;
          const id =
            hdr && typeof hdr === "string" && hdr.length > 0
              ? hdr
              : randomUUID();
          if (req) req.id = id;
          if (res) res.setHeader("x-request-id", id);
          return id;
        },
        // 关闭每次请求/响应的自动日志
        autoLogging: false,
        // 避免为每个请求创建子 logger（在关闭 autoLogging 后可选）
        quietReqLogger: true,
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty" }
            : undefined,
        level: process.env.LOG_LEVEL || "info",
        redact: {
          paths: ["req.headers.authorization"],
          remove: true
        }
      }
    }),
    GitModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
