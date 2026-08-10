import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../../config/configuration';
import { REDIS_CLIENT } from './redis.constants';

const redisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Redis => {
    const logger = new Logger('Redis');
    const config = configService.getOrThrow<RedisConfig>('redis');

    const client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      // 기본 재시도 간격(50ms * n)은 Redis가 떠 있지 않을 때 로그를 과도하게 남긴다.
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });

    client.on('connect', () =>
      logger.log(
        `Connected to ${config.host}:${config.port} (db ${config.db})`,
      ),
    );
    // 에러 핸들러를 붙이지 않으면 연결 실패 시 unhandled error 로 프로세스가 죽는다.
    // ECONNREFUSED는 Node의 AggregateError로 올라오며 message가 비어 있으므로 code로 보완한다.
    client.on('error', (error: Error & { code?: string }) =>
      logger.error(error.message || error.code || error.name),
    );

    return client;
  },
};

/**
 * 대기열은 여러 모듈에서 사용하므로 전역 모듈로 등록한다.
 */
@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
