import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 10;

/**
 * 존재하지 않는 이메일로 로그인을 시도할 때 비교할 더미 해시.
 * 이걸 두지 않으면 사용자가 없을 때 bcrypt 비교를 건너뛰어 응답이 빨라지고,
 * 응답 시간 차이만으로 가입된 이메일인지 알아낼 수 있다.
 */
const DUMMY_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  BCRYPT_ROUNDS,
);

export interface AuthUserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthUserResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    return toAuthUser(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // 이메일이 없는 경우와 비밀번호가 틀린 경우를 같은 응답으로 처리한다.
    // 응답이 갈리면 가입된 이메일을 알아낼 수 있다.
    // 사용자가 없을 때도 더미 해시로 비교해 응답 시간을 맞춘다.
    const isValid = await bcrypt.compare(
      dto.password,
      user ? user.password : DUMMY_HASH,
    );

    if (!user || !isValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: toAuthUser(user),
    };
  }
}

function toAuthUser(user: User): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
