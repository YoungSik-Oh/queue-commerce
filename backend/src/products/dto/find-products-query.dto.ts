import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export class FindProductsQueryDto {
  // 쿼리스트링은 항상 문자열로 들어오므로 @Type으로 숫자 변환을 명시해야
  // @IsInt가 통과한다. main.ts의 transform: true와 함께 동작한다.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE, {
    message: `한 번에 최대 ${MAX_PAGE_SIZE}개까지 조회한다.`,
  })
  limit?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
