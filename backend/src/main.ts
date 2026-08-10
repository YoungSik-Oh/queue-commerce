import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Redis 커넥션과 DB 커넥션을 정상적으로 닫으려면 shutdown hook이 필요하다.
  app.enableShutdownHooks();
  app.enableCors();

  const port = app.get(ConfigService).getOrThrow<number>('app.port');
  await app.listen(port);

  new Logger('Bootstrap').log(`Server listening on http://localhost:${port}`);
}

void bootstrap();
