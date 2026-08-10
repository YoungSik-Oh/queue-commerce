import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * AppModule 전체를 띄우므로 PostgreSQL과 Redis가 실행 중이어야 한다.
 *   docker compose -f infra/docker-compose/docker-compose.yml up -d
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) 서비스 정보를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ service: 'queue-commerce-api', status: 'running' });
  });

  it('/health (GET) DB와 Redis 상태를 반환한다', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
