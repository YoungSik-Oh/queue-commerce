# queue-commerce · backend

NestJS 기반 API 서버. Modular Monolith 구조로 시작한다.

## 실행

```bash
npm install
npm run start:dev     # http://localhost:3000
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run start:dev` | 개발 서버 (watch) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run test` | 단위 테스트 |
| `npm run test:e2e` | E2E 테스트 |

## 모듈 구조

```text
src/
├─ common/          예외 처리, 응답 포맷, 로깅, 인터셉터
├─ config/          환경변수, DB 설정, Redis 설정
├─ auth/            회원가입, 로그인, JWT 발급, 인증 가드
├─ users/           사용자 정보
├─ products/        상품 목록/상세, 관리자 상품 CRUD
├─ open-run/        오픈런 이벤트
├─ waiting-queue/   Redis 대기열, 입장 허용, 입장 토큰
├─ orders/          주문 생성/조회, 재고 차감, 중복 주문 방지
├─ payments/        Mock 결제
└─ admin/           관리자 기능
```

각 모듈은 현재 폴더만 생성된 상태이며, 다음 단계부터 순차적으로 구현한다.
상세 설계는 [docs/architecture.md](../docs/architecture.md)를 참고한다.
