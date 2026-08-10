import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * 로그인 검증용. password는 엔티티에서 select: false 이므로 명시적으로 가져온다.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  create(input: CreateUserInput): Promise<User> {
    const user = this.userRepository.create({
      email: input.email,
      password: input.passwordHash,
      name: input.name,
      role: input.role ?? UserRole.USER,
    });

    return this.userRepository.save(user);
  }
}
