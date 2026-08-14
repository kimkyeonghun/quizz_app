# Architecture

## 구성

- `src/config`: 게임 레지스트리와 JSON 기본 설정 검증
- `src/data`: Zod 문제 스키마, 자동 로더, 필터와 셔플
- `src/store`: 세션·팀·점수·타이머·진행·Undo 상태
- `src/App.tsx`: 화면 흐름과 게임별 표시 어댑터
- `data`: 런타임 문제 데이터
- `scripts`: 데이터 검증과 현황 보고

세 게임 엔진은 레지스트리의 `engine` 값으로 구분합니다. Speed는 정답/패스 후 즉시 다음 문제로 이동하고, Standard는 문제별 타이머와 사회자 판정을 사용하며, Progressive는 단계 인덱스와 단계별 배점을 추가합니다.

`HostAction`은 팀 ID가 포함된 discriminated union입니다. Zustand 저장소가 액션 직전 상태를 최대 50개 보관해 점수와 문제 진행을 함께 되돌립니다. 플레이 중 고빈도 타이머 값은 세션 복원 대상에서 제외하며, 새로고침 시 안전하게 게임 설정 화면으로 돌아갑니다.
