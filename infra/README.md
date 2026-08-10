# Infra

로컬 개발과 배포에 사용하는 실행 환경 설정을 관리한다.

| 경로 | 역할 |
| --- | --- |
| `docker-compose/` | PostgreSQL, Redis, backend, frontend 통합 실행 |
| `nginx/` | 리버스 프록시 설정 (frontend 정적 서빙 + `/api` 프록시) |
| `scripts/` | 초기화 / 배포 / 운영 스크립트 |

Docker Compose 구성은 다음 단계에서 추가한다.
