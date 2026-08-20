# Remaining Games Integration Handoff

## Integration result — 2026-08-21

- 기존 6개 게임의 현재 세션 엔진과 UI를 기준으로 충돌을 해결했습니다.
- 사용자 선택 화면에는 음악 전주, 로고 확대, 영화 포스터, 노래 그림을 추가했습니다.
- `zoom_image`는 기존 세션 호환용으로만 유지하고, `taboo`는 기능 플래그 뒤에 유지했습니다.
- 신규 모듈도 `ready → preview/active → attempt → revealed`, 사회자 콘솔, 직접 입력, 단계 타이머, 팀 잠금, Undo, 영속 상태 v6을 사용합니다.
- 회사 브랜치의 JSON과 샘플 미디어는 로컬에는 보존하되 Git 인덱스에서는 제거했습니다.
- 아래의 원래 인계 내용은 통합 판단의 근거로 보존합니다.

기준일: 2026-08-20

이 문서는 회사 환경의 `feature/remaining-games-current-adapter` 변경을 기존 6개 게임이 완성된 메인 환경에 적용하기 위한 인수인계 자료입니다. 메인 환경의 기존 6개 게임과 세션 구조를 최종 기준으로 취급합니다.

## Branch baseline

- 현재 브랜치: `feature/remaining-games-current-adapter`
- 오늘 변경 비교 기준: `6060abe docs: document remaining game integration`
- 원격: `origin` (`kimkyeonghun/quizz_app`)
- push 후 오늘 변경의 실제 커밋 해시는 `git log --oneline 6060abe..feature/remaining-games-current-adapter`로 확인합니다.

기존 브랜치 커밋은 다음 두 계층으로 나뉩니다.

- 모듈 계층: `3ee6404`, `46afc42`, `b1bfbe3`, `cdcf668`
- 현재 앱 어댑터 계층: `3f45143`, `3934bbe`, `6060abe`

`46afc42`에는 저장소용 가상 샘플 데이터와 에셋이 포함되어 있습니다. 메인 환경의 정책이 모든 게임 데이터 제외라면 이 커밋은 그대로 가져오지 말고 필요한 코드만 선택 적용해야 합니다.

원격 `main`에는 없지만 현재 브랜치 이력에는 포함된 콘텐츠 경로:

- `data/logo-quiz/logos.json`
- `data/movie-poster/movie-posters.json`
- `data/music-intro/music-intros.json`
- `data/song-drawing/song-drawings.json`
- `data/taboo/taboo.json`
- `data/zoom-image/zoom-images.json`
- `public/assets/new-games/`

## Changes after 6060abe

### Logo and zoom merge

- 사용자 노출 게임은 `logo_quiz` 하나로 통합했습니다.
- 로고는 작은 영역, 중간 영역, 전체의 정확히 세 단계로 공개됩니다.
- 기본 배점은 `[3, 2, 1]`, 단계 시간은 10초입니다.
- 기존 JSON에 crop이 없으면 `16%`, `50%`, `100%` 기본 crop을 Zod 파싱 시 추가합니다.
- `zoom_image` ID, 스키마, 모듈은 기존 세션 복원용으로 유지합니다.
- `zoom_image`는 `availableGameDefinitions`에서만 제외하여 선택 화면에 표시하지 않습니다.

주요 파일:

- `src/game-modules/logo-quiz/index.tsx`
- `src/game-modules/logo-quiz/schema.ts`
- `src/game-modules/shared/VisualAsset.tsx`
- `src/adapters/newGames.ts`
- `src/adapters/NewGameQuestionContent.tsx`

### Movie poster title masks

- 포스터 원본 위에 정규화된 0~100 좌표 마스크를 렌더링합니다.
- 마스크 모드는 `BLUR`와 `BLANK`입니다.
- 정답 공개 전에는 마스크를 표시하고 공개 후에는 제거합니다.
- `posterAspectRatio` 기본값은 `2:3`, `titleMasks` 기본값은 빈 배열입니다.

새 metadata 예시:

```json
{
  "releaseYear": 2025,
  "country": "대한민국",
  "posterAspectRatio": { "width": 2, "height": 3 },
  "titleMasks": [
    { "x": 8, "y": 74, "width": 84, "height": 16, "mode": "BLANK" }
  ],
  "license": "ORIGINAL",
  "credit": "권리 확인 정보"
}
```

주요 파일:

- `src/game-modules/movie-poster/index.tsx`
- `src/game-modules/movie-poster/schema.ts`
- `src/game-modules/shared/MediaFrame.module.css`

### Song drawing redesign

- 세 개의 그림을 순차 공개하던 방식을 곡당 완성 그림 한 장으로 변경했습니다.
- 앱은 콘텐츠 제작 시 선택된 화풍을 `visualStyle`로 저장합니다.
- 허용 화풍은 `CHILD_DOODLE`, `ADULT_SKETCH`, `PROFESSIONAL_ILLUSTRATION`입니다.
- `lyricConcept`에는 가사 원문이 아니라 그림 제작에 사용한 장면과 정서 요약을 기록합니다.
- 새 문제는 단일 단계, 기본 25초, 정답 1점입니다.
- 과거 샘플의 `stageSymbolIds`는 파싱 호환을 위해 선택 필드로만 남겼습니다.

새 metadata 예시:

```json
{
  "artist": "아티스트명",
  "visualStyle": "PROFESSIONAL_ILLUSTRATION",
  "lyricConcept": "도시의 밤을 지나 서로를 다시 찾는 장면",
  "license": "ORIGINAL",
  "credit": "권리 확인 정보"
}
```

주요 파일:

- `src/game-modules/song-drawing/index.tsx`
- `src/game-modules/song-drawing/schema.ts`
- `src/adapters/newGames.ts`
- `src/adapters/NewGameQuestionContent.tsx`

## Integration order

1. 메인 환경 최신본에서 `integration/remaining-games` 브랜치를 만듭니다.
2. 모듈 파일을 먼저 적용하고 타입 검사와 기존 6개 회귀 테스트를 실행합니다.
3. `VisualAsset.tsx`와 `MediaFrame.module.css` 변경을 적용합니다.
4. 메인 환경의 게임 레지스트리 구조를 확인한 뒤 어댑터 변경을 수동 적용합니다.
5. 기존 `zoom_image` 세션이 있다면 ID는 삭제하지 말고 선택 메뉴에서만 숨깁니다.
6. 테스트 변경을 적용하고 전체 검증을 실행합니다.

충돌 가능성이 높은 파일은 `src/adapters/newGames.ts`, `src/adapters/NewGameQuestionContent.tsx`, `src/App.test.tsx`, `tests/e2e/session-flow.spec.ts`입니다. 이 파일은 메인 환경 구현을 우선하고 신규 모듈 연결 부분만 옮깁니다.

## Data and assets excluded from Git

회사 환경에서 만든 운영 테스트 50문제와 에셋은 `.git/info/exclude`로만 제외되어 있습니다.

- `.local-content/`
- `data/*/local-operational-test.json`
- `public/assets/local-test/`

이 파일들은 브랜치를 push해도 메인 환경으로 전달되지 않습니다. 현재 로컬 콘텐츠는 구조 시험용이며 최신 한국 영화와 K-pop 운영 데이터가 아닙니다. 메인 환경에서 권리가 확인된 데이터와 에셋을 다시 수집해야 합니다.

주의: `.git/info/exclude` 자체도 Git으로 공유되지 않습니다. 메인 환경에서 같은 로컬 테스트 파일명을 만들 경우 해당 환경의 exclude 설정을 별도로 추가해야 합니다.

## Verification completed

2026-08-20 회사 환경 결과:

- `npm run validate:data`: 17개 파일, 232문제, 오류 0
- `npm test`: 5개 파일, 25개 테스트 통과
- `npm run test:e2e`: TV와 노트북 프로젝트 총 4개 통과
- `npm run lint`: 통과
- `npm run build`: 통과

로컬 50문제가 제외된 메인 환경에서는 전체 문제 수가 달라지는 것이 정상입니다. 문제 수 자체보다 검증 오류 0건과 게임별 최소 데이터 존재 여부를 확인합니다.

## Production content requirements

- 로고: 문제별 세 crop이 브랜드의 식별 난이도에 맞는지 수동 확인합니다.
- 영화: 최근 한국 영화 포스터 원본과 사용 권리를 확보하고 한글 제목 영역을 `titleMasks`로 지정합니다.
- 노래 그림: K-pop 가사 원문을 저장하지 않고 `lyricConcept`만 기록합니다. 곡마다 세 화풍 중 하나를 콘텐츠 제작 시 무작위 선택해 완성 이미지 한 장을 제작합니다.
- 모든 미디어: `source`, `metadata.license`, `metadata.credit`을 유지합니다.

## Final checks in main environment

```bash
npm install
npm run validate:data
npm test
npm run test:e2e
npm run lint
npm run build
```

기존 6개 게임의 점수, Undo, 새로고침 복원 E2E가 통합 전후 동일하게 통과해야 합니다.
