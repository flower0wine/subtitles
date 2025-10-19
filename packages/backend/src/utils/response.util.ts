import { HttpStatus } from "@nestjs/common";
import { STATUS_CODE, StatusCode } from "@/constants";
import { IApiResponse } from "@/types/response.interface";

export const ResponseData = <T, E>(
  ok: boolean,
  code: StatusCode,
  data?: T,
  message?: string,
  error?: E
): IApiResponse<T, E> => ({
  ok,
  code,
  message,
  data,
  error
});

export class ResponseUtil {
  static ok<T, E>(data?: T, message?: string): IApiResponse<T, E> {
    return ResponseData(true, STATUS_CODE.OK, data, message, undefined as E);
  }

  static error<T, E>(
    code: StatusCode,
    message?: string,
    error?: E
  ): IApiResponse<T, E> {
    return ResponseData(false, code, undefined as T, message, error);
  }

  static unknownError<T, E>(message?: string): IApiResponse<T, E> {
    return ResponseData(
      false,
      STATUS_CODE.UNKNOWN_ERROR,
      undefined as T,
      message,
      undefined as E
    );
  }

  static serverError<T, E>(message?: string): IApiResponse<T, E> {
    return ResponseData(
      false,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined as T,
      message,
      undefined as E
    );
  }
}
