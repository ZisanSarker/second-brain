import { Logger } from '@nestjs/common';

interface EnvCheck {
  name: string;
  required: boolean;
  mustNotBeDefault?: boolean;
  defaultValue?: string;
}

const CHECKS: EnvCheck[] = [
  { name: 'DATABASE_URL', required: true },
  { name: 'REDIS_HOST', required: true },
  {
    name: 'JWT_SECRET',
    required: true,
    mustNotBeDefault: true,
    defaultValue: 'super-secret-jwt-key-change-in-production',
  },
  { name: 'MINIO_ENDPOINT', required: true },
  { name: 'MINIO_ACCESS_KEY', required: true },
  { name: 'MINIO_SECRET_KEY', required: true },
  { name: 'MINIO_BUCKET', required: true },
];

export function validateEnvironment(logger: Logger): void {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const check of CHECKS) {
    const value = process.env[check.name];

    if (!value && check.required) {
      errors.push(`Missing required environment variable: ${check.name}`);
      continue;
    }

    if (check.mustNotBeDefault && value === check.defaultValue) {
      errors.push(
        `${check.name} is still set to the default value "${check.defaultValue}". Change it in production.`,
      );
    }
  }

  if (isProduction && !process.env.OPENROUTER_API_KEY) {
    errors.push('OPENROUTER_API_KEY is required in production');
  }

  if (errors.length > 0) {
    for (const error of errors) {
      logger.error(error);
    }
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  logger.log('All required environment variables are set');
}
