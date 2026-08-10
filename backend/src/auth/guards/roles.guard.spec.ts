import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  const buildContext = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  const adminUser: AuthenticatedUser = {
    id: 1,
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };
  const normalUser: AuthenticatedUser = {
    id: 2,
    email: 'user@example.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('@Roles가 없으면 누구나 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(buildContext(normalUser))).toBe(true);
  });

  it('요구 역할을 가진 사용자는 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(buildContext(adminUser))).toBe(true);
  });

  it('역할이 부족하면 403을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(buildContext(normalUser))).toThrow(
      ForbiddenException,
    );
  });

  it('인증되지 않은 요청은 403을 던진다', () => {
    // JwtAuthGuard를 빠뜨린 채 @Roles만 붙인 경우 통과시키면 안 된다.
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
