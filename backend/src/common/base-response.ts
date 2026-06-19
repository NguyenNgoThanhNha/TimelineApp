// Khuôn response chung (giữ theo convention của NestApiTemplate).
export class BaseResponse<T> {
  StatusCode = 200;
  Message = 'Success';
  TotalRecord = 0;
  Data?: T;
}

export enum StatusCode {
  Success = 200,
  Error = 500,
  DataInputInvalid = 400,
}

export const StatusMessage = {
  Success: 'Success',
  Error: 'Error',
  DataNotFound: 'Data not found',
  DataInputInvalid: 'Invalid input',
};
