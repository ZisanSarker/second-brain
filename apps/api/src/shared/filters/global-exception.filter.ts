import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object') {
        const resp = response as Record<string, unknown>;
        const respMessage = resp.message;
        message = Array.isArray(respMessage)
          ? respMessage.join('; ')
          : ((respMessage as string) ?? message);
        details = resp.details;
      }
    } else if (exception instanceof Error) {
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    const errorName = HttpStatus[statusCode] ?? 'UNKNOWN';
    const errorResponse: ErrorResponse = {
      statusCode,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(details ? { details } : {}),
    };

    const logMessage = `${request.method} ${request.url} ${statusCode} - ${message}`;
    if (statusCode >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logMessage);
    }

    httpAdapter.reply(ctx.getResponse(), errorResponse, statusCode);
  }
}
