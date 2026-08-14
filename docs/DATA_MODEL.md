# Data Model

모든 문제는 `id`, `gameType`, nullable `answer`, `category`, `difficulty`, `enabled`, `verified`를 공유합니다. 최상위 오탈자를 잡기 위해 알 수 없는 속성은 거부합니다.

게임별 필수 metadata:

- `four_syllable`: `prompt`, `fullAnswer`
- `three_in_time`: `prompt`, `requiredCount`, `validationMode: "host"`
- `progressive_hint`: 두 개 이상의 `hints`
- `football_career`: 순차적인 `career`, `revealStages`, `verifiedAt`

정답이 있는 문제는 `acceptedAnswers`에 기본 정답을 포함해야 합니다. 데이터 검증은 Unicode NFC, 대소문자, 연속 공백을 정규화해 중복을 검사합니다. 문제를 제거할 때는 ID를 재사용하거나 삭제하는 대신 `enabled: false`를 사용합니다.
