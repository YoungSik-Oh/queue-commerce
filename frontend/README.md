# queue-commerce · frontend

React + TypeScript + Vite 기반 클라이언트. 사용자 화면과 관리자 화면을 모두 포함한다.

## 실행

```bash
npm install
npm run dev           # http://localhost:5173
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |

## 구조

```text
src/
├─ app/          앱 초기화, 전역 Provider
├─ api/          Axios 인스턴스, API 호출 모듈
├─ pages/        라우트 단위 화면
├─ components/   공용 UI 컴포넌트
├─ features/     도메인 단위 기능
├─ hooks/        커스텀 훅
├─ stores/       전역 상태
└─ routes/       라우팅 정의
```

## 화면 목록

- 사용자: 로그인, 상품 목록, 상품 상세, 대기방, 내 순번, 주문, 주문 완료
- 관리자: 상품 등록, 오픈런 이벤트 등록, 대기열 상태 조회, 주문 목록 조회

초기에는 디자인보다 기능 흐름이 명확한 것을 우선한다.
