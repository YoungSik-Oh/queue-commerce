import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** getStatus()는 number를 돌려주므로 enum과 직접 비교하지 않는다. */
const SERVER_ERROR_THRESHOLD = 500;

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * 모든 예외를 하나의 형태로 응답한다.
 * 프론트엔드가 응답 모양을 한 가지만 처리하면 되도록 하는 것이 목적이다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorResponseBody = {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message: extractMessage(exception, status),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 예상하지 못한 예외는 원인을 알 수 있도록 스택까지 남긴다.
    if (status >= SERVER_ERROR_THRESHOLD) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}

function extractMessage(exception: unknown, status: number): string | string[] {
  if (exception instanceof HttpException) {
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return payload;
    }
    // ValidationPipe는 message에 실패 사유 배열을 담아 준다.
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload
    ) {
      return (payload as { message: string | string[] }).message;
    }
    return exception.message;
  }

  // 내부 오류 메시지를 그대로 노출하면 구현 정보가 새어 나간다.
  if (status >= SERVER_ERROR_THRESHOLD) {
    return '서버 오류가 발생했습니다.';
  }

  return String(exception);
}
