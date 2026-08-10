# API 명세

> 구현이 진행되면서 갱신한다. 최종적으로는 Swagger로 정리한다.
> Base URL: `http://localhost:3000`

## 인증

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/auth/signup` | 회원가입 | - |
| POST | `/auth/login` | 로그인, JWT 발급 | - |

## 상품

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/products` | 상품 목록 조회 | - |
| GET | `/products/:id` | 상품 상세 조회 | - |
| POST | `/admin/products` | 상품 등록 | ADMIN |
| PATCH | `/admin/products/:id` | 상품 수정 | ADMIN |
| DELETE | `/admin/products/:id` | 상품 삭제 | ADMIN |

## 오픈런 이벤트

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/open-run` | 이벤트 목록 조회 | - |
| GET | `/open-run/:eventId` | 이벤트 상세 조회 | - |
| POST | `/admin/open-run` | 이벤트 등록 | ADMIN |

## 대기열

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/open-run/:eventId/queue/join` | 대기열 참가 | USER |
| GET | `/open-run/:eventId/queue/me` | 내 순번 / 상태 조회 | USER |
| POST | `/admin/open-run/:eventId/queue/allow` | 입장 허용 처리 | ADMIN |

### POST `/open-run/:eventId/queue/join`

이미 등록된 사용자는 중복 등록하지 않는다.

### GET `/open-run/:eventId/queue/me`

대기 중:

```json
{
  "eventId": 1,
  "userId": 10,
  "rank": 342,
  "status": "WAITING",
  "estimatedWaitSeconds": 180
}
```

입장 가능:

```json
{
  "eventId": 1,
  "userId": 10,
  "status": "ENTERED",
  "entryTokenExpiresIn": 300
}
```

### POST `/admin/open-run/:eventId/queue/allow`

대기열 앞에서 `entryLimitPerBatch` 만큼 입장 허용 처리하고 입장 토큰을 발급한다.

## 주문

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/orders` | 주문 생성 | USER + 입장 토큰 |
| GET | `/orders/me` | 내 주문 조회 | USER |
| GET | `/admin/orders` | 전체 주문 조회 | ADMIN |

### POST `/orders` 검증 규칙

1. 로그인한 사용자인가
2. 오픈런 이벤트 대상 상품인가
3. 입장 토큰이 존재하는가
4. 입장 토큰 TTL이 만료되지 않았는가
5. 상품 재고가 남아 있는가
6. 이미 동일 이벤트 상품을 주문하지 않았는가
7. 주문 수량이 제한 수량(`maxPurchaseQuantity`)을 초과하지 않는가
