# GitOps 확장 계획

> 2~3차 목표. 1차 배포는 EC2 + Docker Compose 기반이며 GitOps를 적용하지 않는다.

## 1차 (현재 목표) — GitHub Actions + Docker Compose

```text
Code Push
  → GitHub Actions (Backend test / Frontend build)
  → Docker Image Build
  → Docker Image Push
  → EC2 SSH
  → docker compose pull
  → docker compose up -d
```

## 2~3차 — Kubernetes + Helm + Argo CD

Kubernetes 배포가 가능해진 뒤 적용한다.
GitHub Actions는 이미지를 빌드하고 image tag를 갱신하는 역할까지만 담당하고,
클러스터 반영은 Argo CD가 Git 저장소의 선언 상태를 감지하여 수행한다.

```text
Code Push
  → GitHub Actions Build / Test
  → Docker Image Push
  → Helm values image tag update
  → Git Commit & Push
  → Argo CD Sync
  → Kubernetes Deploy
```

## 디렉터리

| 경로 | 역할 |
| --- | --- |
| `deploy/helm/` | 애플리케이션 Helm Chart |
| `deploy/argocd/` | Argo CD Application 매니페스트 |

현재는 확장 가능성을 고려한 자리만 만들어 두고 비워 둔다.

## 추가 검토 대상

- KEDA — 대기열 길이 기반 오토스케일링
- Prometheus / Grafana — 대기열 지표 및 주문 처리량 모니터링
- k6 — 오픈런 부하 테스트 (`docs/load-test.md`)
