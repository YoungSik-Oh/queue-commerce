import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductStatus {
  /** 판매 중. 목록/상세에 노출된다. */
  ON_SALE = 'ON_SALE',
  /** 품절. 노출은 하되 주문은 막는다. */
  SOLD_OUT = 'SOLD_OUT',
  /** 비공개. 오픈런 시작 전 미리 등록해 두는 상품이 여기 해당한다. */
  HIDDEN = 'HIDDEN',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // 원 단위 정수로 저장한다. decimal을 쓰면 TypeORM이 문자열로 돌려줘서
  // 응답마다 형변환이 필요하고, 원화는 소수점을 쓰지 않는다.
  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.HIDDEN })
  status: ProductStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 하드 삭제하면 이 상품을 참조하는 주문 이력까지 깨진다.
  // 삭제된 상품은 조회에서만 빼고 행은 남긴다.
  @DeleteDateColumn()
  deletedAt: Date | null;
}
