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

/** int 컬럼 상한. 이 값을 넘으면 DB 저장 단계에서 터진다. */
const INT_MAX = 2147483647;

export class CreateProductDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt({ message: '가격은 원 단위 정수여야 합니다.' })
  @Min(0)
  @Max(INT_MAX)
  price: number;

  @IsInt()
  @Min(0)
  @Max(INT_MAX)
  stock: number;

  // 생략하면 엔티티 기본값인 HIDDEN으로 등록된다.
  // 오픈런은 미리 만들어 두고 나중에 여는 흐름이라 비공개가 기본이다.
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
