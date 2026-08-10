# API 명세

> 구현이 진행되면서 갱신한다. 최종적으로는 Swagger로 정리한다.
> Base URL: `http://localhost:3000`

## 시스템

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/` | 서비스 정보 | - |
| GET | `/health` | DB / Redis 연결 상태 | - |

### GET `/health`

정상일 때 200:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

하나라도 끊기면 503:

```json
{
  "status": "error",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "down", "message": "ECONNREFUSED" }
  }
}
```

## 공통 에러 응답

모든 예외는 하나의 형태로 응답한다.

```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "path": "/auth/login",
  "timestamp": "2026-08-11T00:00:00.000Z"
}
```

DTO 검증에 실패하면 `message`가 배열로 온다.

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": ["비밀번호는 8자 이상이어야 합니다."],
  "path": "/auth/signup",
  "timestamp": "2026-08-11T00:00:00.000Z"
}
```

## 인증

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/auth/signup` | 회원가입 | - |
| POST | `/auth/login` | 로그인, JWT 발급 | - |
| GET | `/auth/me` | 내 정보 조회 | USER |

### POST `/auth/signup`

```json
{ "email": "user@example.com", "password": "password123", "name": "홍길동" }
```

201 응답. 비밀번호 해시는 응답에 포함하지 않는다.

```json
{ "id": 1, "email": "user@example.com", "name": "홍길동", "role": "USER" }
```

이미 가입된 이메일이면 409를 반환한다.

### POST `/auth/login`

```json
{ "email": "user@example.com", "password": "password123" }
```

200 응답.

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "user@example.com", "name": "홍길동", "role": "USER" }
}
```

이메일이 없는 경우와 비밀번호가 틀린 경우 모두 같은 401과 같은 메시지를 반환한다.
응답이 갈리면 가입된 이메일인지 알아낼 수 있기 때문이다.

### 인증이 필요한 요청

```http
Authorization: Bearer <accessToken>
```

토큰이 없거나 만료·위조되면 401을 반환한다.
`ADMIN` 전용 엔드포인트에 `USER` 토큰으로 접근하면 403을 반환한다.

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
