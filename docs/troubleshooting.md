# Troubleshooting

구현 중 발생한 문제와 해결 과정을 기록한다.

기록 형식:

```markdown
## [YYYY-MM-DD] 제목

**상황**
무엇을 하려다 발생했는가.

**원인**
왜 발생했는가.

**해결**
어떻게 해결했는가.

**배운 점**
같은 문제를 다시 만나지 않기 위해 무엇을 기억할 것인가.
```

---

## [2026-08-11] Redis 연결 실패 로그가 빈 줄로 찍힘

**상황**
Redis가 떠 있지 않은 상태로 backend를 실행했더니, ioredis의 `error` 이벤트 핸들러에서
`logger.error(error.message)`를 호출했는데 로그에 메시지 없이 `ERROR [Redis]`만 반복해서 찍혔다.
연결 실패인지 인증 실패인지 구분할 수 없었다.

**원인**
Node.js가 IPv4/IPv6 동시 연결(happy eyeballs)을 시도하면서 연결 실패를 `AggregateError`로 감싼다.
이때 `error.message`는 빈 문자열이고 실제 원인은 `error.code`(`ECONNREFUSED`)에 들어 있다.

**해결**
`message`가 비어 있으면 `code`를, 그것도 없으면 `name`을 사용하도록 폴백을 두었다.

```ts
client.on('error', (error: Error & { code?: string }) =>
  logger.error(error.message || error.code || error.name),
);
```

**배운 점**
에러를 로깅할 때 `error.message`만 믿으면 안 된다.
특히 네트워크 계열 에러는 `code`에 실질적인 정보가 들어 있는 경우가 많다.

---

## [2026-08-11] Redis 재연결 로그가 초당 여러 번 쌓임

**상황**
Redis 연결이 안 되는 동안 에러 로그가 초당 5~10줄씩 쌓여서 TypeORM 로그가 묻혔다.

**원인**
ioredis의 기본 `retryStrategy`는 `Math.min(times * 50, 2000)`이라 초기 재시도 간격이 50ms로 매우 짧다.

**해결**
재시도 간격을 늘려 로그 양을 줄였다.

```ts
retryStrategy: (times) => Math.min(times * 200, 5000),
```

**배운 점**
재시도 정책은 복구 속도만이 아니라 로그와 리소스 소모에도 영향을 준다.

---

<!-- 이후 기록을 아래에 추가한다. -->
