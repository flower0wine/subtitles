import { StatusCode } from "@/constants/status-codes.constant";

export interface IApiResponse<T, E> {
  ok: boolean; // true=成功，false=失败
  code: StatusCode; // 0 表示成功，其它为业务错误码
  message?: string; // 友好提示或错误信息
  data?: T; // 成功时为数据，失败为 undefined
  error?: E; // 失败时为错误对象，成功为 undefined
}
