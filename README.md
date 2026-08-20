# 모두의 퀴즈룸

TV나 대형 모니터에 띄워 사회자가 진행하는 오프라인 우선 파티 퀴즈 웹앱입니다. 기존 6개 게임과 음악 전주, 로고 확대 퀴즈, 영화 포스터, 노래 그림을 플레이할 수 있습니다. 설명 금지어 모듈도 포함되어 있지만 기본 feature flag는 꺼져 있습니다. 게임을 선택하면 목적, 진행 순서, 채점 방식과 진행자 팁을 먼저 확인할 수 있습니다.

## 실행

Node.js LTS와 npm이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 출력된 로컬 주소를 열고, TV 연결 시 브라우저 전체화면을 사용합니다. 프로덕션 빌드는 다음과 같이 확인합니다.

```bash
npm run build
npm run preview
```

빌드와 실행에는 백엔드나 인터넷 연결이 필요하지 않습니다. 최초 패키지 설치는 인터넷 연결이 필요합니다.

## 검사

```bash
npm run validate:data
npm run data:report
npm test
npm run test:e2e
npm run lint
```

## 문제 추가

1. 해당 게임의 `data/<game>/` 폴더에 JSON 배열 파일을 추가합니다.
2. 기존 ID를 재사용하지 않고 게임별 metadata 형식을 따릅니다.
3. 이미지가 있다면 `public/assets/` 아래에 넣고 `/assets/...` 경로를 기록합니다.
4. 미디어 문제에는 `metadata.license`와 `metadata.credit`을 기록합니다.
5. `npm run validate:data`를 실행합니다.

런타임은 `data/**/*.json`을 자동으로 번들링하므로 문제 추가 시 React 코드는 수정하지 않습니다. 상세 계약은 [데이터 모델](docs/DATA_MODEL.md)을 참고합니다.

## 브랜치 통합

- `feature/remaining-games-modules`: 신규 6개 모듈, 스키마, 샘플 데이터와 에셋만 포함합니다.
- `feature/remaining-games-current-adapter`: 현재 앱의 타입, 스토어, 화면에 모듈을 연결합니다.

다른 환경의 기존 6개 구현을 기준으로 통합할 때는 모듈 브랜치를 먼저 병합한 뒤 테스트합니다. 어댑터 브랜치의 커밋은 `refactor`·`feat`·`test` 순으로 확인하며 필요한 커밋만 적용하고, 충돌 시 기존 6개 구현을 우선합니다. 자세한 계약은 [신규 게임 모듈](docs/NEW_GAME_MODULES.md)을 참고합니다.

회사 환경의 최신 변경을 메인 환경에 적용할 때는 [통합 인수인계](docs/INTEGRATION_HANDOFF.md)를 먼저 확인합니다. 로컬 운영 테스트 데이터와 에셋은 Git에 포함하지 않습니다.

## 진행 단축키

- `Space`: 시작, 일시정지, 재개
- `1`~`4`: 해당 팀 정답
- `P`: 패스
- `N`: 다음 문제
- `U`: 실행 취소
