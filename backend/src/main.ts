import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — allow all origins for dev + production
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Increase payload size limit
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve uploaded files statically
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(path.join(uploadsDir, 'gallery'))) fs.mkdirSync(path.join(uploadsDir, 'gallery'), { recursive: true });
  if (!fs.existsSync(path.join(uploadsDir, 'magazines'))) fs.mkdirSync(path.join(uploadsDir, 'magazines'), { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('V-Connect 2.0 API')
    .setDescription(
      'Vignan Institute of Technology and Science — College ERP + LMS API',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 V-Connect API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
