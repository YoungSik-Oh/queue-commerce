# Redis 대기열 설계

## 설계 목표

판매 시작 시점에 몰리는 요청을 그대로 주문 API로 흘려보내지 않고,
**대기열 → 입장 허용 → 입장 토큰 → 주문**의 단계를 거치게 하여
실제 주문 트래픽을 서버가 감당 가능한 수준으로 평탄화한다.

## Redis 키 구조

```text
queue:event:{eventId}:waiting          Sorted Set   대기 중인 사용자 (score = 진입 순서)
queue:event:{eventId}:entered          Set          입장 허용된 사용자
queue:event:{eventId}:seq              String       INCR 기반 진입 순서 sequence
queue:event:{eventId}:status:{userId}  Hash         사용자별 대기 상태 정보
entry-token:{eventId}:{userId}         String+TTL   입장 토큰
```

### waiting (Sorted Set)

- `value` : `userId` (초기 구현 기준. 이후 비로그인 대응 시 `sessionId` 검토)
- `score` : 진입 순서. `timestamp` 또는 `INCR`로 생성한 sequence 값
  - `timestamp`는 동시 진입 시 score가 겹칠 수 있어 순서가 흔들릴 수 있다.
  - `INCR` sequence는 값이 반드시 단조 증가하므로 순번이 안정적이다.

### 순번 조회

`ZRANK`로 현재 인덱스를 얻고, 0-based 이므로 `+1`하여 사용자에게 노출한다.

## 상태 전이

```text
NONE ──join──> WAITING ──allow──> ENTERED ──order──> DONE
                  │                   │
                  └──── 이벤트 종료 ───┴──> EXPIRED
```

## 입장 허용

- 관리자 API 또는 배치 로직이 대기열 앞에서 `entryLimitPerBatch` 만큼 꺼낸다.
- 꺼낸 사용자는 `waiting`에서 제거하고 `entered`에 추가한다.
- 동시에 `entry-token:{eventId}:{userId}`를 TTL과 함께 발급한다.

## 입장 토큰

- Redis String + TTL로 관리한다.
- 주문 API는 토큰 존재 여부와 TTL 만료 여부를 검증한다.
- 토큰이 없거나 만료되면 주문을 막는다.
- TTL이 지나면 Redis가 자동으로 키를 제거하므로 별도 정리 로직이 필요 없다.

## API 응답 예시

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

## 검토 필요 항목

- 순번 갱신 방식: 폴링 vs SSE / WebSocket (MVP는 폴링)
- 입장 허용 트리거: 관리자 수동 호출 vs 스케줄러 배치
- 이탈 사용자 처리: 토큰만 만료시킬지, 재고를 즉시 반환할지
- 대기열 진입 자체의 동시성: `ZADD NX`로 중복 등록 방지
