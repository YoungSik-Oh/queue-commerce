import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

/**
 * DB 없이 검증하기 위해 UsersService를 목으로 대체한다.
 * bcrypt는 실제로 호출해 해싱/비교가 맞물리는지 함께 확인한다.
 */
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmail' | 'findByEmailWithPassword' | 'create'>
  >;
  let jwtService: { signAsync: jest.Mock };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    email: 'test@example.com',
    password: 'hashed',
    name: '테스터',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('비밀번호를 해싱해서 저장하고 해시는 응답에 포함하지 않는다', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((input) =>
        Promise.resolve(
          buildUser({ email: input.email, password: input.passwordHash }),
        ),
      );

      const result = await service.signup({
        email: 'test@example.com',
        password: 'password123',
        name: '테스터',
      });

      const savedHash = usersService.create.mock.calls[0][0].passwordHash;
      expect(savedHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', savedHash)).toBe(true);
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: '테스터',
        role: UserRole.USER,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('이미 가입된 이메일이면 409를 던진다', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'password123',
          name: '테스터',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('비밀번호가 맞으면 토큰과 사용자 정보를 반환한다', async () => {
      const password = 'password123';
      usersService.findByEmailWithPassword.mockResolvedValue(
        buildUser({ password: await bcrypt.hash(password, 10) }),
      );

      const result = await service.login({
        email: 'test@example.com',
        password,
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        role: UserRole.USER,
      });
    });

    it('비밀번호가 틀리면 401을 던진다', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(
        buildUser({ password: await bcrypt.hash('password123', 10) }),
      );

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('없는 이메일이어도 비밀번호 오류와 같은 401과 같은 메시지를 반환한다', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      // 응답이 갈리면 가입된 이메일인지 알아낼 수 있다.
      await expect(
        service.login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
