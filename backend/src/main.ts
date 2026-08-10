import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Redis 커넥션과 DB 커넥션을 정상적으로 닫으려면 shutdown hook이 필요하다.
  app.enableShutdownHooks();
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      // DTO에 없는 필드는 잘라낸다. role을 실어 보내 권한을 올리는 시도를 막는다.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = app.get(ConfigService).getOrThrow<number>('app.port');
  await app.listen(port);

  new Logger('Bootstrap').log(`Server listening on http://localhost:${port}`);
}

void bootstrap();
