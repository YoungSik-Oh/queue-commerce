import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Authorization: Bearer <token> 을 검증하고 request.user를 채운다.
 *
 * passport-jwt 대신 직접 구현했다. 검증 로직이 짧고, 의존성이 줄며,
 * 단위 테스트에서 JwtService만 목으로 바꾸면 되기 때문이다.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      // 만료와 위조를 구분해서 알려주면 공격자에게 힌트가 된다.
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    (request as Request & { user: AuthenticatedUser }).user = user;

    return true;
  }
}

function extractBearerToken(header?: string): string | undefined {
  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}
