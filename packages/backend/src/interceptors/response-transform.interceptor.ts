import { map, Observable } from "rxjs";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { IApiResponse } from "@/types/response.interface";
import { ResponseUtil } from "@/utils/response.util";

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IApiResponse<T, never>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<IApiResponse<T, never>> {
    return next
      .handle()
      .pipe(map((data: T) => ResponseUtil.ok<T, never>(data)));
  }
}
