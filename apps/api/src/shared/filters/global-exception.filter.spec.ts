import { GlobalExceptionFilter } from './global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockHttpAdapter: any;
  let mockAdapterHost: HttpAdapterHost;

  beforeEach(() => {
    mockHttpAdapter = {
      reply: jest.fn(),
    };
    mockAdapterHost = { httpAdapter: mockHttpAdapter } as any;
    filter = new GlobalExceptionFilter(mockAdapterHost);
  });

  function createMockHost(url: string, method = 'GET') {
    const request = { url, method };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as any;
  }

  describe('HttpException handling', () => {
    it('should return 404 with not found message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const host = createMockHost('/api/v1/test');

      filter.catch(exception, host);

      const [response, body] = mockHttpAdapter.reply.mock.calls[0];
      expect(body.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
      expect(body.path).toBe('/api/v1/test');
    });

    it('should return 401 for unauthorized', () => {
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      const host = createMockHost('/api/v1/auth/profile');

      filter.catch(exception, host);

      const [, body] = mockHttpAdapter.reply.mock.calls[0];
      expect(body.statusCode).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return validation error details', () => {
      const validationResponse = {
        message: ['email must be a valid email', 'password must be at least 8 characters'],
        error: 'Bad Request',
        statusCode: 400,
      };
      const exception = new HttpException(validationResponse, HttpStatus.BAD_REQUEST);
      const host = createMockHost('/api/v1/auth/register');

      filter.catch(exception, host);

      const [, body] = mockHttpAdapter.reply.mock.calls[0];
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('email must be a valid email');
    });
  });

  describe('Unknown error handling', () => {
    it('should return 500 for unknown errors', () => {
      const exception = new Error('Something broke internally');
      const host = createMockHost('/api/v1/documents');

      filter.catch(exception, host);

      const [, body] = mockHttpAdapter.reply.mock.calls[0];
      expect(body.statusCode).toBe(500);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('Response format', () => {
    it('should always include statusCode, error, message, timestamp, path', () => {
      const exception = new HttpException('Test', HttpStatus.FORBIDDEN);
      const host = createMockHost('/api/v1/test');

      filter.catch(exception, host);

      const [, body] = mockHttpAdapter.reply.mock.calls[0];
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('path');
    });
  });
});
