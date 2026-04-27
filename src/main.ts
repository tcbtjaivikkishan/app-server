import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // ✅ Disable default parser (IMPORTANT)
  });

  // 🔐 Security
  app.use(helmet());

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🌍 CORS
  app.enableCors({
    origin: '*', // restrict later
    credentials: true,
  });

    const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('Interactive API documentation')
    .setVersion('1.0')
    .addBearerAuth() // if using JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);


  // 🔥 CRITICAL: RAW BODY for Zoho webhook ONLY
  app.use('/payments/webhook', bodyParser.raw({ type: '*/*' }));

  // ✅ Normal JSON parser for all other routes
  app.use(bodyParser.json());

  await app.listen(3000);
}

bootstrap();