# Person assets

115개의 인물 사진은 Wikimedia Commons에서 재사용 가능한 파일만 500px 이하로 내려받은 것입니다. 저작자, 원본 파일 페이지, 라이선스와 수정 내역은 `data/person/persons.json`의 각 `attribution`에 기록되어 있습니다. 파일을 교체할 때는 해당 메타데이터와 확인일도 함께 갱신하고 `npm run validate:data`를 실행합니다.

`private/`의 44개 이미지는 친구 모임용 로컬 전용 콘텐츠이며 사람 24명과 애니메이션 캐릭터 20개로 구성됩니다. `data/person/private-persons.json`에 `private_only`로 표시되어 있으며 외부 재배포 대상이 아닙니다.
