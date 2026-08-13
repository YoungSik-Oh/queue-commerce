import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import {
  DEFAULT_PAGE_SIZE,
  FindProductsQueryDto,
} from './dto/find-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProducts {
  items: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

/** 비로그인 사용자에게 보여줄 상태. HIDDEN은 관리자만 볼 수 있다. */
const PUBLIC_STATUSES = [ProductStatus.ON_SALE, ProductStatus.SOLD_OUT];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  findAllPublic(query: FindProductsQueryDto): Promise<PaginatedProducts> {
    // 공개 목록은 항상 공개 상태로 한 번 걸러낸다. status 필터가 함께 오면
    // 교집합이 되므로 status=HIDDEN으로 요청해도 결과가 새지 않는다.
    const statuses = query.status
      ? PUBLIC_STATUSES.filter((status) => status === query.status)
      : PUBLIC_STATUSES;

    return this.paginate({ status: In(statuses) }, query);
  }

  async findOnePublic(id: number): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({
      where: { id, status: In(PUBLIC_STATUSES) },
    });

    // HIDDEN 상품에 403을 주면 그 id에 상품이 있다는 사실이 드러난다.
    // 없는 것과 똑같이 404로 응답한다.
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return toProductResponse(product);
  }

  findAllForAdmin(query: FindProductsQueryDto): Promise<PaginatedProducts> {
    return this.paginate(query.status ? { status: query.status } : {}, query);
  }

  async findOneForAdmin(id: number): Promise<ProductResponse> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return toProductResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      stock: dto.stock,
      // 생략하면 엔티티 기본값 HIDDEN이 적용되도록 undefined를 그대로 넘긴다.
      status: dto.status,
    });

    return toProductResponse(await this.productRepository.save(product));
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductResponse> {
    // preload는 soft delete된 행을 찾지 않으므로 삭제된 상품은 여기서 걸린다.
    const product = await this.productRepository.preload({ id, ...dto });
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return toProductResponse(await this.productRepository.save(product));
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.softDelete(id);

    // 이미 삭제됐거나 없는 id면 affected가 0이다.
    if (!result.affected) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
  }

  private async paginate(
    where: FindOptionsWhere<Product>,
    query: FindProductsQueryDto,
  ): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const [products, total] = await this.productRepository.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: products.map(toProductResponse), total, page, limit };
  }
}

/** deletedAt 같은 내부 컬럼이 응답에 새어 나가지 않도록 명시적으로 옮긴다. */
function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
