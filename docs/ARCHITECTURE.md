# Architecture

## 구성

- `src/config`: 게임 레지스트리와 JSON 기본 설정 검증
- `src/data`: Zod 문제 스키마, 자동 로더, 필터와 셔플
- `src/store`: 세션·팀·점수·타이머·진행·Undo 상태
- `src/game-modules`: 신규 미디어 게임의 스키마·화면·런타임 모듈
- `src/adapters`: 신규 모듈을 현재 게임 레지스트리와 세션 엔진에 연결
- `src/App.tsx`: 화면 흐름과 게임별 표시 어댑터
- `data`: 런타임 문제 데이터
- `scripts`: 데이터 검증과 현황 보고

콘텐츠 공급자는 Vite mode alias로 분리됩니다. 기본 mode는 로컬 `/data`, `/public`을 사용하고 `fixture` mode는 `tests/fixtures`만 사용합니다. 두 공급자는 같은 `QuestionBundle` 파서로 합쳐지며 구조화된 `ContentIssue`를 데이터 관리 화면에 전달합니다. 따라서 코드 CI는 private 운영 콘텐츠 없이도 동일한 게임·세션 경로를 검사합니다.

세 게임 엔진은 레지스트리의 `engine` 값으로 구분합니다. Speed는 별도의 라운드 시계를 사용하고, Standard는 문제별 시계와 사회자 판정을 사용하며, Progressive는 전 팀 도전·배점·팀 잠금과 한 단계 이상의 공개 흐름을 추가합니다. 선수 커리어는 Progressive의 단일 단계 모드로 전체 경력을 즉시 표시합니다. 공통 `GameplayPhase`가 시작 전 비공개, 설명자 미리보기, 진행, 도전 판정, 정답 공개를 제어합니다.

각 `GameDefinition`은 플레이 로직뿐 아니라 목표, 진행 단계, 채점 방식, 진행자 팁을 포함합니다. 게임 선택 후 공통 안내 화면이 이 정보를 렌더링하므로 새로운 게임을 추가할 때 별도 안내 컴포넌트를 만들 필요가 없습니다.

`HostAction`은 팀 ID가 포함된 discriminated union입니다. Zustand 저장소가 액션 직전 상태를 최대 50개 보관해 점수와 문제 진행을 함께 되돌립니다. 플레이 중 고빈도 타이머 값은 세션 복원 대상에서 제외하며, 새로고침 시 안전하게 게임 설정 화면으로 돌아갑니다.

사회자 콘솔은 별도 브라우저 팝업에 React portal로 렌더링됩니다. 같은 Zustand 저장소를 사용하므로 참가자 화면과 별도 동기화 서버 없이 정답·타이머·판정 상태 및 조작이 즉시 공유됩니다.

`answerMode: "direct_input"`에서는 참가자 화면에 답안 폼을 렌더링하고 정규화된 `answer`·`acceptedAnswers`와 비교합니다. 자동 판정이 가능한 닫힌 정답형 게임에만 제공하며, 진행형 오답은 기존 `LOCK_CURRENT_STAGE` 액션 흐름을 재사용합니다.

신규 모듈은 자체 Zod 스키마와 `QuestionView`를 가지지만 별도 세션 엔진을 만들지 않습니다. `playableGameRegistry`가 기존 6개 정의와 신규 모듈 정의를 합치고, 현재 Zustand의 단계 타이머·팀 잠금·Undo·영속 상태를 그대로 사용합니다. `zoom_image`는 과거 세션 복원용으로 등록만 유지하고 선택 화면에서는 숨기며, `taboo`는 기능 플래그가 켜질 때만 노출합니다.
