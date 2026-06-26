import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Compression (before helmet per security best practice)
  app.use(compression());

  // Security headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('AI Second Brain - API Service')
    .setDescription('NestJS Backend API Modular Monolith for AI Second Brain')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.PORT_API || 3001;
  await app.listen(port);
  console.log(`NestJS Server running on http://localhost:${port}`);
  console.log(`OpenAPI Docs available at http://localhost:${port}/api/docs`);
  console.log(`GraphQL Playground available at http://localhost:${port}/graphql`);
}
bootstrap();
