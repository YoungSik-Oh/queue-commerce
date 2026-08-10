import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../users/entities/user.entity';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let jwtService: { verifyAsync: jest.Mock };
  let guard: JwtAuthGuard;

  const buildContext = (
    authorization?: string,
  ): {
    context: ExecutionContext;
    request: {
      headers: Record<string, string | undefined>;
      user?: AuthenticatedUser;
    };
  } => {
    const request = { headers: { authorization } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('유효한 토큰이면 통과시키고 request.user를 채운다', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'user@example.com',
      role: UserRole.ADMIN,
    });
    const { context, request } = buildContext('Bearer valid.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 7,
      email: 'user@example.com',
      role: UserRole.ADMIN,
    });
  });

  it('Authorization 헤더가 없으면 401을 던진다', async () => {
    const { context } = buildContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('Bearer 스킴이 아니면 401을 던진다', async () => {
    const { context } = buildContext('Basic dXNlcjpwYXNz');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('토큰 검증에 실패하면 401을 던진다', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { context } = buildContext('Bearer expired.token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
