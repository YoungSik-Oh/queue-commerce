import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from './configuration';

export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const db = configService.getOrThrow<DatabaseConfig>('database');

  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    // 각 모듈에서 TypeOrmModule.forFeature로 등록한 엔티티를 자동으로 수집한다.
    autoLoadEntities: true,
    synchronize: db.synchronize,
    logging: db.logging,
  };
};
