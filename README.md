# 모두의 퀴즈룸

TV나 대형 모니터에 띄워 사회자가 진행하는 오프라인 우선 파티 퀴즈 웹앱입니다. 현재 MVP에는 인물 퀴즈, 몸으로 말해요, 네 글자 이어말하기, 5초 안에 3개, 3단 힌트, 선수 커리어 맞히기가 포함됩니다. 게임을 선택하면 목적, 진행 순서, 채점 방식과 진행자 팁을 먼저 확인할 수 있습니다.

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
4. `npm run validate:data`를 실행합니다.

런타임은 `data/**/*.json`을 자동으로 번들링하므로 문제 추가 시 React 코드는 수정하지 않습니다. 상세 계약은 [데이터 모델](docs/DATA_MODEL.md)을 참고합니다.

## 진행 단축키

- `Space`: 시작, 일시정지, 재개
- `1`~`4`: 해당 팀 정답
- `P`: 패스
- `N`: 다음 문제
- `U`: 실행 취소
