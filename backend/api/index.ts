let cachedServer: any;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedServer) {
      const { NestFactory } = require('@nestjs/core');
      const { ExpressAdapter } = require('@nestjs/platform-express');
      const { ValidationPipe } = require('@nestjs/common');
      const { AppModule } = require('../src/app.module');
      const express = require('express');

      const server = express();
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        logger: ['error', 'warn', 'log'],
      });

      app.enableCors({ origin: true, credentials: true });
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } })
      );
      app.setGlobalPrefix('api');
      await app.init();
      
      cachedServer = server;
    }

    cachedServer(req, res);
  } catch (err: any) {
    console.error('FATAL IMPORT OR STARTUP ERROR:', err.message, err.stack);
    res.status(500).json({ error: 'Fatal Startup Error', message: String(err), stack: err.stack || '' });
  }
}
