import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

import cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // Stripe webhook precisa do corpo bruto para validar assinatura
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

  app.use(cookieParser());

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();