import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔐 Security headers
  app.use(helmet());

  // ⚡ Compression (faster responses)
  // app.use(compression());

  // ✅ Global Validation (VERY IMPORTANT)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // remove extra fields
      forbidNonWhitelisted: true, // throw error on unknown fields
      transform: true,        // auto transform DTO types
    }),
  );

  // 🌍 Enable CORS (frontend connection)
  app.enableCors({
    origin: '*', // later restrict to your domain
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();