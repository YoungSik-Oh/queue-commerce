import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/** 관리자 전용 엔드포인트에 붙인다. JwtAuthGuard와 함께 사용해야 한다. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
