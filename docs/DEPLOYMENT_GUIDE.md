# Party Quiz 배포 및 파티룸 운영 가이드

기준일: 2026-08-21

## 1. 결론

Party Quiz의 현재 권장 배포 방식은 **Cloudflare Pages Direct Upload**입니다.

메인 환경에서 운영 콘텐츠를 생성·검증하고 production build를 만든 뒤, 완성된 `dist` 디렉터리만 Cloudflare Pages에 업로드합니다. 운영 `/data`, `/public`이 Git에서 제외되어 있으므로 Git 저장소만 연결해서 빌드하는 방식보다 현재 콘텐츠 관리 정책에 잘 맞습니다.

```text
메인 환경
콘텐츠 생성 → manifest 생성 → 전체 검증 및 build → dist
                                                    ↓
                                       Cloudflare Pages 업로드
                                                    ↓
                            파티룸 노트북에서 HTTPS 주소로 접속
                                                    ↓
                                  HDMI 또는 확장 화면으로 TV 출력
```

현재 앱은 네트워크 API와 서버 데이터베이스가 없는 정적 Vite 앱이므로 일반적인 한 장소·한 브라우저 운영에는 별도 애플리케이션 서버가 필요하지 않습니다.

## 2. Cloudflare Pages를 권장하는 이유

- 로컬에서 미리 빌드한 정적 파일을 그대로 Direct Upload할 수 있습니다.
- 정적 에셋 요청은 Free 및 Paid 플랜 모두 무료이며 제한 없이 제공됩니다. Pages Functions를 추가하면 해당 요청에는 Workers 할당량이 적용됩니다.
- `pages.dev` HTTPS 주소가 기본 제공됩니다.
- production 배포 이력을 이용해 이전 버전으로 즉시 롤백할 수 있습니다.
- Wrangler 방식은 사이트당 최대 20,000개 파일을 올릴 수 있습니다.

현재 공식 제한상 개별 파일 최대 크기는 25 MiB입니다. 이미지나 음악 파일 하나가 이를 넘으면 미디어를 압축하는 것을 우선하며, 그래도 해결되지 않을 때만 R2 같은 별도 스토리지를 검토합니다. 비공개 콘텐츠를 공개 R2 버킷으로 옮기면 접근 제어가 우회될 수 있으므로 주의해야 합니다.

참고 자료:

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)

## 3. Direct Upload와 Git 연동 중 Direct Upload를 선택하는 이유

Git 연동은 push할 때마다 자동 배포된다는 장점이 있지만, 현재 운영 데이터와 에셋은 Git에 포함되지 않습니다. 따라서 GitHub에서 `npm run build:production`을 실행하면 완전한 운영 콘텐츠를 받을 수 없습니다.

Direct Upload에서는 다음 경계를 유지할 수 있습니다.

- GitHub Actions: 합성 fixture로 코드 품질 검증
- 메인 환경: 비공개 운영 콘텐츠 생성 및 권리 검수
- Cloudflare Pages: 메인 환경에서 검증을 통과한 `dist`만 호스팅

Direct Upload로 만든 Pages 프로젝트는 나중에 Git 연동 프로젝트로 전환할 수 없습니다. 자동 Git 배포가 필요해지면 별도의 Pages 프로젝트를 생성해야 합니다. 현재 구조에서는 이것을 감수하고 콘텐츠 경계를 지키는 편이 더 안전합니다.

## 4. 최초 배포 절차

### 4.1 운영 콘텐츠 준비

메인 환경에서 콘텐츠 생성과 권리 검수를 끝냅니다. 특히 `private_only` 콘텐츠가 배포 대상에 포함되는지 확인해야 합니다.

### 4.2 manifest 생성 및 검증

Windows PowerShell에서는 다음 명령을 사용합니다.

```powershell
npm.cmd run manifest:content
npm.cmd run verify:content
```

`verify:content`가 실패하면 배포를 중단하고 보고된 콘텐츠, 에셋, hash 또는 라이선스 문제를 먼저 해결합니다. 검증이 통과하면 production `dist`가 생성됩니다.

### 4.3 Cloudflare Pages 프로젝트 생성

```powershell
npx.cmd wrangler login
npx.cmd wrangler pages project create
```

프로젝트 이름은 예를 들어 `party-quiz`로 지정합니다. 최초 생성 후 `https://party-quiz.pages.dev` 형태의 주소가 제공됩니다. 이미 같은 이름이 사용 중이면 실제 주소에 임의 문자열이 추가될 수 있습니다.

### 4.4 production 배포

```powershell
npx.cmd wrangler pages deploy dist --project-name=party-quiz
```

업로드가 끝나면 배포 주소에서 다음 항목을 직접 확인합니다.

1. 홈 화면과 게임 선택 화면이 열린다.
2. 운영 문항과 이미지가 표시된다.
3. 음악 재생이 사용자 클릭 후 정상적으로 시작된다.
4. 게임 시작, 채점, Undo와 결과 화면이 정상 동작한다.
5. 사회자 팝업이 열리고 참가자 화면에 정답이 노출되지 않는다.

## 5. 반복 배포 절차

코드, JSON 또는 에셋이 변경될 때마다 다음 순서를 반복합니다.

```powershell
npm.cmd run manifest:content
npm.cmd run verify:content
npx.cmd wrangler pages deploy dist --project-name=party-quiz
```

manifest는 실제 파일의 SHA-256과 크기를 기록하므로 콘텐츠나 에셋을 변경한 뒤에는 반드시 다시 생성해야 합니다. 이전 manifest를 유지한 채 배포하려고 하면 production 검증이 실패하는 것이 정상입니다.

권장 운영 원칙:

- 검증 실패 상태에서는 업로드하지 않습니다.
- 파티 당일이 아니라 최소 하루 전에 production 주소로 전체 흐름을 확인합니다.
- 안정적으로 사용했던 이전 deployment는 삭제하지 않고 롤백 대상으로 남깁니다.
- Cloudflare API 토큰을 만들 경우 저장소나 문서에 기록하지 않습니다.

## 6. 공개 콘텐츠와 접근 제어

정적 사이트에 포함된 JSON, 이미지와 오디오는 사이트에 접근할 수 있는 사용자가 내려받을 수 있습니다. 화면에서 링크를 숨기는 것은 접근 제어가 아닙니다.

### 모든 콘텐츠가 재배포 가능한 경우

기본 `pages.dev` 주소로 공개 배포할 수 있습니다. 그래도 검색 노출을 원하지 않는다면 검색 엔진 설정을 별도로 추가해야 하며, `robots.txt`만으로 콘텐츠가 비공개가 되지는 않습니다.

### `private_only` 또는 개인 이용권 콘텐츠가 포함된 경우

커스텀 도메인을 연결하고 Cloudflare Zero Trust Access에서 허용된 이메일만 접근할 수 있도록 보호하는 구성을 권장합니다. Access는 유효한 인증 쿠키가 없는 요청을 차단합니다.

Pages 설정에서 preview deployment용 Access policy만 활성화하면 production `pages.dev` 주소와 커스텀 도메인은 보호되지 않습니다. production 주소는 별도의 Access 애플리케이션과 정책으로 보호해야 합니다.

참고 자료:

- [Cloudflare Access authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/)
- [Cloudflare Access policy management](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/policy-management/)
- [Pages preview access 주의 사항](https://developers.cloudflare.com/pages/configuration/preview-deployments/)

### 외부 호스팅이 허용되지 않는 콘텐츠가 포함된 경우

클라우드에 업로드하지 않습니다. 파티룸에 가져갈 노트북에 build 결과와 Node 환경을 준비하고 로컬 서버로 실행합니다.

## 7. 파티룸 권장 운영 방식

현재 앱은 한 대의 노트북과 두 화면을 기준으로 운영하는 것이 가장 안정적입니다.

1. 노트북에서 배포 주소를 Chrome 또는 Edge로 엽니다.
2. 노트북을 TV에 HDMI로 연결하고 디스플레이를 확장합니다.
3. 참가자용 메인 화면을 TV로 이동해 전체 화면으로 표시합니다.
4. 사회자 콘솔 팝업은 노트북 화면에 둡니다.
5. 게임 전에 브라우저 팝업 허용, TV 해상도, 오디오 출력과 음량을 확인합니다.

사회자 팝업은 같은 브라우저에서 열리고 같은 애플리케이션 상태를 사용합니다. 별도 휴대폰이나 다른 노트북에서 동일한 URL을 열면 독립된 세션이 시작됩니다.

## 8. 현재 지원하지 않는 원격 동기화

배포는 앱에 접근 가능한 HTTPS 주소를 제공할 뿐, 여러 기기의 게임 상태를 동기화하지는 않습니다.

현재 세션 상태는 브라우저의 local storage에 저장됩니다. 따라서 다음 기능은 아직 지원되지 않습니다.

- 휴대폰에서 사회자가 조작하면 TV가 실시간으로 따라오는 기능
- 여러 참가자가 각자 휴대폰 버저를 사용하는 기능
- 다른 브라우저에서 같은 세션에 재접속하는 기능
- 서버에 점수와 게임 기록을 저장하는 기능

이 기능이 필요해지면 세션 코드, 방 참가 코드, WebSocket 또는 실시간 데이터베이스, 사회자 권한과 재접속 복구가 포함된 별도 백엔드 단계가 필요합니다. 정적 Pages 배포와는 분리해서 개발하는 것이 좋습니다.

## 9. 인터넷 장애 대비 로컬 fallback

파티룸 Wi-Fi가 느리거나 외부 접속이 차단될 가능성에 대비해 배포에 사용한 프로젝트와 `dist`를 노트북에 함께 보관합니다.

인터넷을 사용할 수 없으면 프로젝트 디렉터리에서 다음 명령으로 로컬 서버를 실행합니다.

```powershell
npm.cmd run preview
```

같은 노트북 브라우저에서 표시된 localhost 주소로 접속한 뒤 TV에 연결하면 인터넷 없이 운영할 수 있습니다. `dist/index.html`을 `file://` 방식으로 직접 여는 것은 ES module과 미디어 로딩 정책 때문에 권장하지 않습니다.

다른 기기가 노트북의 로컬 서버에 접속해야 한다면 같은 Wi-Fi에서 노트북의 LAN IP와 preview 포트를 사용해야 합니다. 다만 파티룸의 게스트 Wi-Fi가 기기 간 통신을 차단할 수 있고 Windows Firewall 설정도 필요할 수 있으므로, 이를 주 운영 방식으로 의존하지 않는 것이 좋습니다.

## 10. 배포 당일 체크리스트

### 출발 전

- [ ] `npm.cmd run verify:content` 통과
- [ ] Cloudflare production 주소에서 전체 게임 실행 확인
- [ ] 운영 콘텐츠의 공개·비공개 권리 범위 확인
- [ ] `private_only` 콘텐츠가 있으면 Access 로그인 확인
- [ ] 배포에 사용한 `dist`와 프로젝트를 노트북에 보관
- [ ] 노트북 충전기, HDMI 케이블과 필요한 변환 젠더 준비

### 현장 도착 후

- [ ] 노트북과 TV 해상도 및 화면 확장 확인
- [ ] 브라우저 팝업 허용
- [ ] TV 또는 외부 스피커 오디오 출력 확인
- [ ] 실제 운영 주소에서 이미지와 음악 한 문제씩 확인
- [ ] 사회자 화면이 참가자에게 보이지 않는지 확인
- [ ] Wi-Fi 장애 시 `npm.cmd run preview` fallback 확인

## 11. 후속 개발 권장 순서

1. 정확한 버전의 `wrangler`를 개발 의존성으로 고정합니다.
2. `verify:content` 성공 후에만 업로드하는 `deploy:production` 명령을 추가합니다.
3. HTML과 미디어에 적절한 cache header를 추가합니다.
4. 배포 버전과 manifest 생성 시각을 검수 화면에 표시합니다.
5. 현장 인터넷 없이도 사용할 필요가 커지면 service worker 기반 오프라인 캐시를 추가합니다.
6. 휴대폰 사회자 기능이 필요해질 때 별도 실시간 세션 서버를 설계합니다.

자동 배포를 추가하더라도 private 운영 데이터를 GitHub Actions에 업로드하지 않는다는 현재 원칙은 유지합니다. 메인 환경 또는 별도의 보호된 배포 환경에서 production artifact를 만든 뒤, 검증된 `dist`만 배포해야 합니다.
