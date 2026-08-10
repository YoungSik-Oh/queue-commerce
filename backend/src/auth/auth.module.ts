import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtConfig } from '../config/configuration';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<JwtConfig>('jwt');
        return {
          secret: jwt.secret,
          // expiresIn은 '1h' 같은 템플릿 리터럴 타입을 요구하지만
          // 환경변수는 항상 일반 string이라 캐스팅이 필요하다.
          // 값의 유효성은 Joi 스키마와 기동 시 JWT 서명에서 걸러진다.
          signOptions: {
            expiresIn: jwt.expiresIn as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  // 다른 모듈(products, orders 등)에서 가드를 재사용한다.
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
