import { UserRole } from '../../users/entities/user.entity';

/** 토큰 발급 시 담는 정보. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

/** 검증 후 request.user에 실리는 정보. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}
