import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.constants';

type ComponentStatus = { status: 'up' } | { status: 'down'; message: string };

interface HealthResponse {
  status: 'ok' | 'error';
  info: {
    database: ComponentStatus;
    redis: ComponentStatus;
  };
}

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isHealthy = database.status === 'up' && redis.status === 'up';
    const response: HealthResponse = {
      status: isHealthy ? 'ok' : 'error',
      info: { database, redis },
    };

    // 로드밸런서와 배포 스크립트가 상태를 판단할 수 있도록 실패 시 503을 반환한다.
    if (!isHealthy) {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', message: toMessage(error) };
    }
  }

  private async checkRedis(): Promise<ComponentStatus> {
    try {
      const pong: string = await this.redis.ping();
      if (pong !== 'PONG') {
        return { status: 'down', message: `unexpected PING reply: ${pong}` };
      }
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', message: toMessage(error) };
    }
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
