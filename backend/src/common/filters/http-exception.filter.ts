import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { createErrorModel } from '../response.util';

/**
 * Bắt mọi exception, trả về khuôn lỗi { StatusCode, Message, Data, TotalRecord }.
 * Khác với template gốc (luôn HTTP 200): ở đây trả ĐÚNG HTTP status (404/400/500…)
 * để frontend (axios) xử lý lỗi sạch sẽ.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const m = (res as { message?: string | string[] }).message;
        message = Array.isArray(m) ? m.join(', ') : (m ?? exception.message);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json(createErrorModel(status, message));
  }
}
