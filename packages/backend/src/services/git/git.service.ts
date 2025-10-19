import * as os from "os";
import { basename, join } from "path";
import { ensureDir, pathExists } from "fs-extra";
import simpleGit, { SimpleGit } from "simple-git";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { STATUS_CODE } from "@/constants";

export interface CloneOptions {
  url: string;
  dirName?: string; // 可选：自定义目录名
}

export interface CloneData {
  targetPath: string;
  dirName: string;
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);

  // 计算跨平台的默认克隆目录：~/<nice-repos>
  private getDefaultBaseDir(): string {
    const home = os.homedir();
    const base = join(home, "nice-repos");
    return base;
  }

  private deriveDirNameFromUrl(url: string): string {
    try {
      if (url.startsWith("git@")) {
        // 形如 git@github.com:user/repo.git
        const pathPart = url.split(":", 2)[1] ?? "";
        const name = basename(pathPart);
        return name.endsWith(".git") ? name.slice(0, -4) : name;
      }
      const u = new URL(url);
      const name = basename(u.pathname);
      return name.endsWith(".git") ? name.slice(0, -4) : name;
    } catch (e) {
      // 回退：简单截断
      const trimmed = url.split("/").pop() || "repo";
      return trimmed.endsWith(".git") ? trimmed.slice(0, -4) : trimmed;
    }
  }

  async cloneRepo(opts: CloneOptions): Promise<CloneData> {
    const { url } = opts;

    if (!url || typeof url !== "string") {
      const message = "缺少有效的仓库链接 url";
      this.logger.warn(message);
      throw new HttpException(
        { code: STATUS_CODE.INVALID_ARGUMENT, message },
        HttpStatus.BAD_REQUEST
      );
    }

    const baseDir = this.getDefaultBaseDir();
    const dirName =
      (opts.dirName && opts.dirName.trim()) || this.deriveDirNameFromUrl(url);
    const targetPath = join(baseDir, dirName);

    this.logger.log(`准备克隆仓库: url=${url}, 目标目录=${targetPath}`);

    try {
      await ensureDir(baseDir);

      if (await pathExists(targetPath)) {
        const message = `目标目录已存在：${targetPath}`;
        this.logger.warn(message);
        throw new HttpException(
          { message, code: STATUS_CODE.ALREADY_EXISTS },
          HttpStatus.BAD_REQUEST
        );
      }

      const git: SimpleGit = simpleGit({
        baseDir,
        timeout: { block: 600_000 }
      });

      // 调用本地 git 进行克隆
      await git.clone(url, dirName);

      this.logger.log(`克隆成功：${targetPath}`);
      return { targetPath, dirName };
    } catch (error: any) {
      const message = `克隆失败：${error?.message || error}`;
      this.logger.error(message, error?.stack || undefined);
      // 外部依赖错误：git clone 失败
      throw new HttpException(
        { message, code: STATUS_CODE.GIT_CLONE_FAILED },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
