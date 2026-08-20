# Data Model

모든 문제는 `id`, `gameType`, nullable `answer`, `category`, `difficulty`, `enabled`, `verified`를 공유합니다. 최상위 오탈자를 잡기 위해 알 수 없는 속성은 거부합니다.

게임별 필수 metadata:

- `four_syllable`: `prompt`, `fullAnswer`
- `three_in_time`: `prompt`, `requiredCount`, `validationMode: "host"`
- `progressive_hint`: 두 개 이상의 `hints`
- `football_career`: 순차적인 `career`, `revealStages`, `verifiedAt`
- `music_intro`: `artist`, `clipStartSec`, 단계별 `clipDurationsSec`, 라이선스 정보
- `zoom_image`: 단계가 진행될수록 넓어지는 `crops`, 라이선스 정보
- `logo_quiz`: `brandCategory`, 선택적인 SVG `symbolId`, 라이선스 정보
- `movie_poster`: `releaseYear`, `country`, 선택적인 SVG `symbolId`, 라이선스 정보
- `song_drawing`: `artist`, 순서가 있는 `stageSymbolIds`, 라이선스 정보
- `taboo`: 네 개 이상의 `forbiddenWords`

정답이 있는 문제는 `acceptedAnswers`에 기본 정답을 포함해야 합니다. 데이터 검증은 Unicode NFC, 대소문자, 연속 공백을 정규화해 중복을 검사합니다. 이미지 crop은 0~100 좌표 안에 있어야 하고, 설명 금지어에는 정답 자체를 넣을 수 없습니다. 문제를 제거할 때는 ID를 재사용하거나 삭제하는 대신 `enabled: false`를 사용합니다.
