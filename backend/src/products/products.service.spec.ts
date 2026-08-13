import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  UpdateResult,
} from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductsService } from './products.service';

/**
 * Repository의 create/save는 오버로드가 있어 jest.Mocked<Pick<...>>로는
 * 시그니처가 맞지 않는다. 필요한 메서드만 직접 정의한다.
 * 인자 타입까지 적어 두어야 mock.calls를 볼 때 any로 새지 않는다.
 */
interface ProductRepositoryMock {
  findOne: jest.Mock<Promise<Product | null>, [FindOneOptions<Product>]>;
  findAndCount: jest.Mock<
    Promise<[Product[], number]>,
    [FindManyOptions<Product>]
  >;
  create: jest.Mock<Partial<Product>, [Partial<Product>]>;
  save: jest.Mock<Promise<Partial<Product>>, [Partial<Product>]>;
  preload: jest.Mock<Promise<Product | undefined>, [Partial<Product>]>;
  softDelete: jest.Mock<Promise<UpdateResult>, [number]>;
}

/**
 * DB 없이 검증하기 위해 Repository를 목으로 대체한다.
 * 여기서 확인하려는 것은 쿼리 결과가 아니라 서비스가 만들어 내는 조회 조건이다.
 * (HIDDEN이 공개 조회에 새지 않는가, 페이지네이션 계산이 맞는가)
 */
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: ProductRepositoryMock;

  const buildProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 1,
    name: '한정판 스니커즈',
    description: null,
    price: 199000,
    stock: 10,
    status: ProductStatus.ON_SALE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  /**
   * In(...) 안에 담긴 값을 꺼낸다. 목이라 실제 쿼리가 돌지 않기 때문에 직접 본다.
   * In의 타입 정의상 value가 단수로 선언돼 있어 배열로 좁혀 준다.
   */
  const statusesIn = (value: unknown): ProductStatus[] =>
    (value as FindOperator<ProductStatus>).value as unknown as ProductStatus[];

  beforeEach(async () => {
    repository = {
      findOne: jest.fn<Promise<Product | null>, [FindOneOptions<Product>]>(),
      findAndCount: jest.fn<
        Promise<[Product[], number]>,
        [FindManyOptions<Product>]
      >(),
      create: jest.fn((dto: Partial<Product>) => dto),
      save: jest.fn((product: Partial<Product>) => Promise.resolve(product)),
      preload: jest.fn<Promise<Product | undefined>, [Partial<Product>]>(),
      softDelete: jest.fn<Promise<UpdateResult>, [number]>(),
    };
    repository.findAndCount.mockResolvedValue([[], 0]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repository },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('findAllPublic', () => {
    it('HIDDEN 상품은 공개 목록에서 제외한다', async () => {
      await service.findAllPublic({});

      const where = repository.findAndCount.mock.calls[0][0].where as {
        status: unknown;
      };
      expect(statusesIn(where.status)).toEqual([
        ProductStatus.ON_SALE,
        ProductStatus.SOLD_OUT,
      ]);
    });

    it('status=HIDDEN으로 요청해도 HIDDEN 상품이 새지 않는다', async () => {
      await service.findAllPublic({ status: ProductStatus.HIDDEN });

      // 공개 상태와의 교집합이라 조회 대상이 비어 결과도 비게 된다.
      const where = repository.findAndCount.mock.calls[0][0].where as {
        status: unknown;
      };
      expect(statusesIn(where.status)).toEqual([]);
    });

    it('page/limit로 skip과 take를 계산한다', async () => {
      await service.findAllPublic({ page: 3, limit: 20 });

      expect(repository.findAndCount.mock.calls[0][0]).toMatchObject({
        skip: 40,
        take: 20,
      });
    });

    it('page/limit를 생략하면 첫 페이지 20개를 조회한다', async () => {
      const result = await service.findAllPublic({});

      expect(repository.findAndCount.mock.calls[0][0]).toMatchObject({
        skip: 0,
        take: 20,
      });
      expect(result).toMatchObject({ page: 1, limit: 20, total: 0 });
    });
  });

  describe('findOnePublic', () => {
    it('공개 상태 상품만 조회 대상으로 삼는다', async () => {
      repository.findOne.mockResolvedValue(buildProduct());

      const result = await service.findOnePublic(1);

      const where = repository.findOne.mock.calls[0][0].where as {
        status: unknown;
      };
      expect(statusesIn(where.status)).toEqual([
        ProductStatus.ON_SALE,
        ProductStatus.SOLD_OUT,
      ]);
      expect(result.id).toBe(1);
      expect(result).not.toHaveProperty('deletedAt');
    });

    it('HIDDEN이거나 없는 상품이면 404를 던진다', async () => {
      repository.findOne.mockResolvedValue(null);

      // HIDDEN에 403을 주면 그 id에 상품이 있다는 사실이 드러난다.
      await expect(service.findOnePublic(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAllForAdmin', () => {
    it('상태 필터가 없으면 HIDDEN까지 모두 조회한다', async () => {
      await service.findAllForAdmin({});

      expect(repository.findAndCount.mock.calls[0][0].where).toEqual({});
    });
  });

  describe('create', () => {
    it('status를 생략하면 엔티티 기본값을 쓰도록 undefined로 넘긴다', async () => {
      await service.create({ name: '스니커즈', price: 199000, stock: 10 });

      expect(repository.create.mock.calls[0][0]).toEqual({
        name: '스니커즈',
        description: null,
        price: 199000,
        stock: 10,
        status: undefined,
      });
    });
  });

  describe('update', () => {
    it('없는 상품이면 404를 던지고 저장하지 않는다', async () => {
      repository.preload.mockResolvedValue(undefined);

      await expect(service.update(999, { price: 1000 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('행을 지우지 않고 soft delete 한다', async () => {
      repository.softDelete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.remove(1);

      // 주문이 참조하는 상품 행이 사라지면 주문 이력이 깨진다.
      expect(repository.softDelete).toHaveBeenCalledWith(1);
    });

    it('이미 삭제됐거나 없는 상품이면 404를 던진다', async () => {
      repository.softDelete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
