# Data Model

모든 문제는 `id`, `gameType`, nullable `answer`, `category`, `difficulty`, `enabled`, `verified`를 공유합니다. 최상위 오탈자를 잡기 위해 알 수 없는 속성은 거부합니다.

게임별 필수 metadata:

- `four_syllable`: `prompt`, `fullAnswer`
- `three_in_time`: `prompt`, `requiredCount`, `validationMode: "host"`, 5개 이상의 `examples`, `judgingNotes`
- `progressive_hint`: 정확히 세 개의 `hints`
- `football_career`: 한 번에 공개할 순차적인 `career`, `verifiedAt`
- `music_intro`: `artist`, `clipStartSec`, 단계별 `clipDurationsSec`, 라이선스·크레딧
- `logo_quiz`: 작은 영역부터 전체까지 정확히 세 개의 `crops`, `brandCategory`, 라이선스·크레딧
- `movie_poster`: `releaseYear`, `country`, `posterAspectRatio`, 정규화 좌표의 `titleMasks`
- `song_drawing`: `artist`, `visualStyle`, 가사 원문이 아닌 `lyricConcept`
- `taboo`: 네 개 이상의 `forbiddenWords`

정답이 있는 문제는 `acceptedAnswers`에 기본 정답을 포함해야 합니다. 데이터 검증은 Unicode NFC, 대소문자, 연속 공백을 정규화해 중복을 검사합니다. 문제를 제거할 때는 ID를 재사용하거나 삭제하는 대신 `enabled: false`를 사용합니다.

인물 이미지에는 `attribution`의 저작자, 원본 URL, 라이선스 또는 로컬 이용 범위, 수정 내역과 확인일이 필요합니다. `usageScope: "private_only"`와 `PRIVATE LOCAL USE`는 친구 모임용 로컬 데이터에만 함께 사용합니다. 사실 기반 문항은 `sources` 배열에 제목, 발행처, URL과 확인일을 기록합니다. 기존 6개 데이터는 게임별 최소 100문항과 약 `20/25/30/20/5%` 난이도 분포를 만족해야 하며, 신규 미디어 게임은 운영 콘텐츠 확정 전까지 구조 검증용 로컬 데이터만 사용합니다. 전체 문항 수는 로컬 데이터 구성에 따라 달라집니다.
