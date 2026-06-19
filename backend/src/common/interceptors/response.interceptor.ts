import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { BaseResponse } from '../base-response';
import { createResponseModel } from '../response.util';

/**
 * Tự bọc mọi giá trị trả về từ controller vào khuôn { StatusCode, Message, TotalRecord, Data }.
 * - Nếu controller trả { data, totalRecord } -> dùng totalRecord đó.
 * - Ngược lại -> bọc trực tiếp, TotalRecord = 0.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<BaseResponse<unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'StatusCode' in data && 'Data' in data) {
          return data as BaseResponse<unknown>;
        }
        if (data && typeof data === 'object' && 'data' in data && 'totalRecord' in data) {
          const payload = data as { data: unknown; totalRecord: number };
          return createResponseModel(payload.data, payload.totalRecord);
        }
        return createResponseModel(data);
      }),
    );
  }
}
