# 모두의 퀴즈룸

TV나 대형 모니터 또는 노트북 한 화면에서 진행하는 오프라인 우선 파티 퀴즈 웹앱입니다. 기존 6개 게임에 음악 전주, 로고 확대, 영화 포스터, 노래 그림을 더해 10개 게임을 선택할 수 있습니다. 모든 게임은 시작 전 문제를 숨기고 게임별 준비·진행·판정 규칙을 적용합니다.

## 실행

Node.js 24.19.0과 npm 11.17.0을 기준으로 합니다. 운영 데이터가 있는 메인 환경은 기본 개발 서버를, 코드만 있는 환경은 Git으로 추적되는 합성 fixture 모드를 사용합니다.

```bash
npm ci
npm run dev
# 운영 데이터가 없는 코드 환경
npm run dev:fixture
```

Windows PowerShell 실행 정책이 `npm.ps1`을 차단하는 경우 같은 명령을 `npm.cmd run dev:fixture` 형식으로 실행합니다.

브라우저에서 출력된 로컬 주소를 열고, TV 연결 시 브라우저 전체화면을 사용합니다. 라운드 설정의 `정답 판정 방식`에서 한 화면 진행용 `참가자가 직접 입력`을 선택할 수 있습니다. 별도 화면을 쓸 때는 플레이 화면의 모니터 아이콘으로 정답·허용 답안·판정 기준과 진행 버튼이 있는 `사회자 콘솔`을 열어 노트북에 두고 참가자 화면을 TV에 배치하세요. 프로덕션 빌드는 다음과 같이 확인합니다.

홈의 `문제 데이터 관리`에서는 등록된 게임별 문항 수와 전체 문제 목록을 조회할 수 있습니다. ID·문제·정답·별칭 검색, 난이도·분류·이용 범위 필터, 이미지·힌트·판정 예시·선수 경력·미디어 메타데이터·출처 상세 확인을 지원합니다.

```bash
npm run build:production
npm run preview
```

빌드와 실행에는 백엔드나 인터넷 연결이 필요하지 않습니다. 최초 패키지 설치는 인터넷 연결이 필요합니다.

## 검사

코드 환경은 루트의 `/data`, `/public`을 사용하지 않고 fixture 스키마, lint, 타입, 단위/UI, fixture build와 TV·노트북 E2E를 한 번에 검사합니다.

```bash
npm run verify:code
```

운영 콘텐츠가 있는 메인 환경은 manifest와 실제 데이터·에셋의 hash, 미디어 길이·크기, 전체 콘텐츠 정책까지 검사합니다.

```bash
npm run manifest:content
npm run verify:content
npm run data:report
```

fixture manifest는 fixture JSON이나 에셋을 의도적으로 변경한 경우에만 `npm run manifest:fixture`로 갱신합니다.

인물 이미지와 선수 경력 데이터를 다시 수집할 때는 네트워크 연결 상태에서 `node scripts/fetch-verified-people.mjs`를 사용합니다. 텍스트 카탈로그는 `node scripts/seed-expanded-content.mjs`로 재생성할 수 있습니다. 생성 후에는 반드시 데이터 검증과 테스트를 다시 수행합니다.

친구 모임용 로컬 전용 인물·캐릭터 44문항은 `npm run seed:private-people`로 다시 받을 수 있습니다. 이 데이터는 `usageScope: "private_only"`로 표시되며 문제 필터의 `로컬 전용 문제 포함`에서 사용 여부를 선택합니다. 이미지와 데이터는 외부에 재배포하지 않는 것을 전제로 합니다.

### Git 데이터 보호

`data/`의 모든 문제 데이터와 다운로드한 `public/` 에셋은 `.gitignore`에서 제외되어 이 PC에만 보관됩니다. 또한 `.githooks/pre-push`가 푸시할 커밋을 검사해 강제로 추가된 문제 데이터와 이미지 에셋의 원격 전송을 차단합니다. 소스 코드와 문서는 계속 추적됩니다.

저장소를 새로 복제한 경우 아래 명령으로 훅을 활성화합니다. 현재 개발 환경에는 이미 적용되어 있습니다.

```bash
git config core.hooksPath .githooks
```

## 문제 추가

1. 해당 게임의 `data/<game>/` 폴더에 JSON 배열 파일을 추가합니다.
2. 기존 ID를 재사용하지 않고 게임별 metadata 형식을 따릅니다.
3. 이미지가 있다면 `public/assets/` 아래에 넣고 `/assets/...` 경로를 기록합니다.
4. `npm run validate:data`를 실행합니다.
5. 데이터와 에셋이 확정되면 `npm run manifest:content`를 실행한 뒤 `npm run verify:content`를 통과시킵니다.

런타임은 manifest를 제외한 `data/**/*.json`을 자동으로 번들링하므로 문제 추가 시 React 코드는 수정하지 않습니다. 상세 계약은 [데이터 모델](docs/DATA_MODEL.md)을 참고합니다.

신규 미디어 게임의 로컬 구조 샘플은 `npm exec tsx scripts/generate-new-game-samples.ts`로 다시 만들 수 있습니다. 생성되는 JSON과 에셋은 Git에 포함되지 않습니다.

## 진행 단축키

- `Space`: 시작, 일시정지, 재개
- `1`~`4`: 속도·일반형은 해당 팀 정답, 단계형은 해당 팀 도전
- `P`: 패스
- `N`: 다음 문제
- `U`: 실행 취소
