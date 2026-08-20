# Data Model

모든 문제는 `id`, `gameType`, nullable `answer`, `category`, `difficulty`, `enabled`, `verified`를 공유합니다. 최상위 오탈자를 잡기 위해 알 수 없는 속성은 거부합니다.

게임별 필수 metadata:

- `four_syllable`: `prompt`, `fullAnswer`
- `three_in_time`: `prompt`, `requiredCount`, `validationMode: "host"`, 5개 이상의 `examples`, `judgingNotes`
- `progressive_hint`: 정확히 세 개의 `hints`
- `football_career`: 한 번에 공개할 순차적인 `career`, `verifiedAt`

정답이 있는 문제는 `acceptedAnswers`에 기본 정답을 포함해야 합니다. 데이터 검증은 Unicode NFC, 대소문자, 연속 공백을 정규화해 중복을 검사합니다. 문제를 제거할 때는 ID를 재사용하거나 삭제하는 대신 `enabled: false`를 사용합니다.

인물 이미지에는 `attribution`의 저작자, 원본 URL, 라이선스 또는 로컬 이용 범위, 수정 내역과 확인일이 필요합니다. `usageScope: "private_only"`와 `PRIVATE LOCAL USE`는 친구 모임용 로컬 데이터에만 함께 사용합니다. 사실 기반 문항은 `sources` 배열에 제목, 발행처, URL과 확인일을 기록합니다. 전체 데이터는 게임별 최소 100문항과 약 `20/25/30/20/5%` 난이도 분포를 만족해야 합니다. 현재 인물 159, 네 글자 120, 선수 커리어 105문항을 포함해 총 684문항입니다.
