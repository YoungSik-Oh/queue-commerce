# Architecture

## 개요

`queue-commerce`는 오픈런 상황의 트래픽 집중을 대기열로 제어하는 쇼핑몰이다.
초기 구조는 **Modular Monolith**이며, 이후 `waiting-queue`를 우선적으로 분리할 수 있도록
도메인 경계를 명확히 유지한다.

## 시스템 구성

```text
[React SPA] ──HTTP──> [Nginx] ──> [NestJS API]
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    [PostgreSQL]            [Redis]
                  상품/주문/사용자        대기열/입장 토큰
```

## Backend 모듈 구조

```text
backend/src/
├─ common/          예외 처리, 응답 포맷, 로깅, 인터셉터
├─ config/          환경변수, DB 설정, Redis 설정
├─ auth/            회원가입, 로그인, JWT 발급, 인증 가드
├─ users/           사용자 정보
├─ products/        상품 목록/상세, 관리자 상품 CRUD
├─ open-run/        오픈런 이벤트 (시작/종료 시간, 대상 상품)
├─ waiting-queue/   Redis 대기열 진입, 순번 조회, 입장 허용, 입장 토큰 발급
├─ orders/          주문 생성/조회, 재고 차감, 중복 주문 방지
├─ payments/        Mock 결제
└─ admin/           관리자 기능
```

## Frontend 구조

```text
frontend/src/
├─ app/          앱 초기화, 전역 Provider
├─ api/          Axios 인스턴스, API 호출 모듈
├─ pages/        라우트 단위 화면
├─ components/   공용 UI 컴포넌트
├─ features/     도메인 단위 기능
├─ hooks/        커스텀 훅
├─ stores/       전역 상태
└─ routes/       라우팅 정의
```

- 사용자 화면: 로그인, 상품 목록, 상품 상세, 대기방, 내 순번, 주문, 주문 완료
- 관리자 화면: 상품 등록, 오픈런 이벤트 등록, 대기열 상태 조회, 주문 목록 조회

## 데이터 저장소 역할 분리

| 저장소 | 역할 |
| --- | --- |
| PostgreSQL | 사용자, 상품, 오픈런 이벤트, 주문 등 영속 데이터와 재고 정합성 |
| Redis | 대기열 순서(Sorted Set), 입장 토큰(String + TTL), 대기 상태(Hash) |

Redis는 단순 캐시가 아니라 **대기열 처리를 위한 핵심 저장소**로 사용한다.

## 확장 계획

1. Docker Compose 기반 EC2 단일 배포 (1차)
2. Kubernetes 전환 + Helm + Argo CD GitOps (2~3차)
3. `waiting-queue` → `queue-service` 로 우선 분리 (MSA 전환 시작점)
