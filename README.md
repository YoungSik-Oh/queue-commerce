# queue-commerce

Redis 기반 대기열로 오픈런 쇼핑몰의 트래픽 진입을 제어하고, NestJS와 React, CI/CD를 적용한 포트폴리오 프로젝트.

## 프로젝트 소개

특정 시간에 트래픽이 몰리는 **오픈런 / 한정판매** 상황을 가정한 쇼핑몰이다.
일반적인 상품 CRUD가 아니라, **Redis Sorted Set 기반 대기열**로 사용자의 주문 진입을
순차적으로 제어하는 것을 핵심 목표로 한다.

### 해결하려는 문제

판매 시작 시점에 요청이 한꺼번에 몰리면 재고보다 많은 주문이 동시에 들어오고,
DB 커넥션과 재고 정합성이 동시에 무너진다.
이 프로젝트는 **주문 API 앞단에 대기열과 입장 토큰을 두어**, 실제 주문 트래픽을
서버가 감당 가능한 수준으로 평탄화하는 구조를 다룬다.

## 핵심 흐름

```text
상품 페이지 접속
  → (판매 전) 대기방 입장
  → (판매 시작) Redis 대기열 등록          ZADD  queue:event:{id}:waiting
  → 내 대기 순번 조회                       ZRANK
  → 서버가 일정 인원씩 입장 허용             batch / admin
  → 입장 토큰 발급 (TTL)                    SET   entry-token:{eventId}:{userId} EX n
  → 토큰이 유효한 동안에만 주문 생성 가능
  → 주문 API 검증 (토큰 / 재고 / 중복 / 수량) → 주문 생성 + 재고 차감
```

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Backend | NestJS, TypeScript, TypeORM, REST API, JWT |
| Database | PostgreSQL |
| Cache / Queue | Redis (Sorted Set, String TTL, Hash) |
| Frontend | React, TypeScript, Vite, React Router |
| Infra | Docker, Docker Compose, Nginx |
| CI/CD | GitHub Actions, EC2 |

### 확장 예정

Kubernetes, Helm, Argo CD (GitOps), KEDA, Prometheus / Grafana, k6

## Repository 구조

```text
queue-commerce/
├─ backend/            # NestJS API 서버
├─ frontend/           # React 클라이언트 (사용자 + 관리자)
├─ infra/
│  ├─ docker-compose/  # 로컬/배포 실행 환경
│  ├─ nginx/           # 리버스 프록시 설정
│  └─ scripts/         # 운영 스크립트
├─ deploy/
│  ├─ helm/            # (확장 예정) Helm Chart
│  └─ argocd/          # (확장 예정) Argo CD Application
├─ docs/               # 설계 및 트러블슈팅 문서
└─ .github/workflows/  # GitHub Actions CI/CD
```

백엔드는 처음부터 MSA로 나누지 않고 **Modular Monolith**로 시작하되,
이후 `waiting-queue`부터 분리할 수 있도록 도메인 경계를 명확히 유지한다.

## 실행 방법

> Docker Compose 기반 통합 실행 환경은 다음 단계에서 추가된다.
> 현재는 각 프로젝트를 개별 실행한다.

### Backend

```bash
cd backend
npm install
npm run start:dev      # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | 전체 아키텍처와 모듈 구조 |
| [docs/queue-design.md](docs/queue-design.md) | Redis 대기열 설계 (키 구조, 입장 토큰) |
| [docs/api-spec.md](docs/api-spec.md) | API 명세 |
| [docs/gitops.md](docs/gitops.md) | GitOps 확장 계획 |
| [docs/troubleshooting.md](docs/troubleshooting.md) | 구현 중 문제와 해결 과정 |

## 진행 상황

- [x] Monorepo 초기 폴더 구조 생성
- [x] NestJS backend 프로젝트 생성
- [x] React frontend 프로젝트 생성
- [ ] Docker Compose (PostgreSQL + Redis) 구성
- [ ] Backend DB / Redis 연결 설정
- [ ] 회원가입 / 로그인 (JWT)
- [ ] 상품 목록 / 상세 / 관리자 상품 등록
- [ ] 오픈런 이벤트 등록
- [ ] Redis 대기열 진입 및 순번 조회
- [ ] 입장 토큰 발급 및 검증
- [ ] 주문 생성 및 재고 차감
- [ ] GitHub Actions CI/CD
