import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductsService } from './products.service';
import type { PaginatedProducts, ProductResponse } from './products.service';

/** 비로그인 사용자도 볼 수 있는 상품 조회. 쓰기는 AdminProductsController에 있다. */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: FindProductsQueryDto): Promise<PaginatedProducts> {
    return this.productsService.findAllPublic(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponse> {
    return this.productsService.findOnePublic(id);
  }
}
