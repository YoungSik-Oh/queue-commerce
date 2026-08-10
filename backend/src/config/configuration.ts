export interface AppConfig {
  nodeEnv: string;
  port: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
}

export default (): Configuration => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    app: {
      nodeEnv,
      port: Number(process.env.PORT ?? 3000),
    },
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'queue',
      password: process.env.DB_PASSWORD ?? 'queue_password',
      database: process.env.DB_NAME ?? 'queue_commerce',
      // synchronize는 스키마를 자동으로 덮어쓰므로 개발 환경에서만 켠다.
      // 운영에서는 migration으로 전환한다.
      synchronize: nodeEnv === 'development',
      logging: nodeEnv === 'development',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB ?? 0),
    },
  };
};
