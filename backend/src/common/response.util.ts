import { BaseResponse, StatusCode, StatusMessage } from './base-response';

export function createResponseModel<T>(data: T, totalRecord = 0): BaseResponse<T> {
  return {
    StatusCode: StatusCode.Success,
    Message: StatusMessage.Success,
    Data: data,
    TotalRecord: totalRecord,
  };
}

export function createErrorModel<T>(
  statusCode: StatusCode | number = StatusCode.Error,
  message: string = StatusMessage.Error,
): BaseResponse<T> {
  return {
    StatusCode: statusCode,
    Message: message,
    Data: undefined,
    TotalRecord: 0,
  };
}
