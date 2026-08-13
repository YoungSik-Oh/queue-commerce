import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminProductsController } from './admin-products.controller';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  // 가드는 클래스 참조로 @UseGuards에 넘기므로 이 모듈 컨텍스트에서 주입 가능해야 한다.
  // AuthModule이 JwtAuthGuard/RolesGuard와 JwtModule을 export한다.
  imports: [TypeOrmModule.forFeature([Product]), AuthModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  // open-run, orders가 상품 조회와 재고 차감에 쓴다.
  exports: [ProductsService],
})
export class ProductsModule {}
