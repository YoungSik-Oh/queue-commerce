import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

const INT_MAX = 2147483647;

/**
 * PATCH 이므로 모든 필드가 선택이다.
 * @nestjs/mapped-types 의 PartialType 을 쓰면 의존성이 하나 늘어서
 * 필드 수가 적은 지금은 그냥 명시한다.
 */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt({ message: '가격은 원 단위 정수여야 합니다.' })
  @Min(0)
  @Max(INT_MAX)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(INT_MAX)
  stock?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
