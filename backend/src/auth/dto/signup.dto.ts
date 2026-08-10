import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(72, {
    message: 'bcrypt 제한으로 비밀번호는 72자를 넘을 수 없습니다.',
  })
  password: string;

  @IsString()
  @Length(2, 50)
  name: string;
}
