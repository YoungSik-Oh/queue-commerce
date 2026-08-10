# Infra

로컬 개발과 배포에 사용하는 실행 환경 설정을 관리한다.

| 경로 | 역할 |
| --- | --- |
| `docker-compose/` | PostgreSQL, Redis 실행 환경 |
| `nginx/` | 리버스 프록시 설정 (frontend 정적 서빙 + `/api` 프록시) |
| `scripts/` | 초기화 / 배포 / 운영 스크립트 |

## Docker Compose

```bash
cd infra/docker-compose
cp .env.example .env
docker compose up -d
```

| 명령 | 설명 |
| --- | --- |
| `docker compose ps` | 컨테이너 상태 및 healthcheck 확인 |
| `docker compose logs -f` | 로그 확인 |
| `docker compose down` | 컨테이너 종료 (데이터 유지) |
| `docker compose down -v` | 컨테이너 종료 + 볼륨 삭제 (데이터 초기화) |

### 서비스

| 서비스 | 이미지 | 포트 | 볼륨 |
| --- | --- | --- | --- |
| postgres | `postgres:16-alpine` | 5432 | `postgres-data` |
| redis | `redis:7-alpine` | 6379 | `redis-data` |

Redis는 `--appendonly yes`로 AOF를 켠다.
대기열 데이터가 유실되면 사용자 순번이 통째로 사라지므로, 캐시와 달리 재시작 후에도 복구되어야 한다.

### 접속 확인

```bash
docker compose exec postgres psql -U queue -d queue_commerce -c "SELECT 1;"
docker compose exec redis redis-cli ping
```

backend / frontend 컨테이너와 Nginx는 CI/CD 단계에서 Dockerfile과 함께 추가한다.
