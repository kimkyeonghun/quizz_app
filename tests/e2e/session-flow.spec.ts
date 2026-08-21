import { expect, test, type Page } from "@playwright/test";

async function openGame(page: Page, label: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByRole("button", { name: "게임 선택" }).click();
  const card = page.locator("article").filter({ hasText: label });
  await card.getByRole("button", { name: "게임 안내" }).click();
  await page.getByRole("button", { name: "게임 설정" }).click();
  await expect(page.getByText(/개 문제 사용 가능/)).toBeVisible();
  const roundCount = page.getByLabel("라운드 문제 수");
  if (await roundCount.count()) {
    await page.locator(".advanced-settings").getByText("고급 설정").click();
    await roundCount.fill("2");
  }
}

test("관리자 페이지에서 fixture 데이터와 로드 상태를 조회한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "문제 데이터 관리" }).click();
  await expect(page.getByRole("heading", { name: "문제 데이터 관리" })).toBeVisible();
  await expect(page.getByLabel("데이터 현황")).toContainText("로드 오류0");
  await page.getByLabel("문항 검색").fill("테스트 인물");
  await expect(page.getByLabel("인물 퀴즈 문제 목록")).toContainText("테스트 인물");
});

test("인물 퀴즈는 시작 전 사진을 숨기고 판정과 Undo를 함께 처리한다", async ({ page }) => {
  await openGame(page, "인물 퀴즈");
  await expect(page.locator(".question-count strong")).toHaveText("2");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await expect(page.getByText("문제가 아직 공개되지 않았습니다")).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "사회자 화면 열기" }).click();
  const host = await popupPromise;
  await expect(host.getByText("사회자 콘솔")).toBeVisible();
  await expect(host.locator(".host-answer-guide h2")).not.toBeEmpty();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.locator(".person-question img")).toBeVisible();
  await page.getByRole("button", { name: "A팀 정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("1");
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("0");
});

test("몸으로 말해요는 설명자 확인 후 제시어를 숨긴다", async ({ page }) => {
  await openGame(page, "몸으로 말해요");
  await page.locator(".advanced-settings").getByText("고급 설정").click();
  await page.getByLabel("설명자 확인 시간 (초)").fill("1");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByText("설명자만 확인하세요")).toBeVisible();
  await expect(page.getByText("설명 중")).toBeVisible({ timeout: 3000 });
});

test("네 글자 이어말하기는 시작 후 앞 두 음절을 공개한다", async ({ page }) => {
  await openGame(page, "네 글자 이어말하기");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByText("뒤의 두 글자는?")).toBeVisible();
  await page.getByRole("button", { name: "패스" }).click();
  await expect(page.locator(".question-progress")).toContainText("2 / 2");
});

test("네 글자 이어말하기 직접 입력 모드는 같은 화면에서 자동 채점한다", async ({ page }) => {
  await openGame(page, "네 글자 이어말하기");
  await page.getByLabel("정답 판정 방식").selectOption("direct_input");
  await page.getByLabel("문제 순서").selectOption("data");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByLabel("정답 입력")).toBeVisible();
  await page.getByLabel("정답 입력").fill("테스정답");
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("1");
});

test("5초 안에 3개는 설정된 문항 큐와 사회자 판정을 사용한다", async ({ page }) => {
  await openGame(page, "5초 안에 3개");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await expect(page.locator(".question-progress")).toContainText("1 / 2");
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await page.getByRole("button", { name: "A팀 성공" }).click();
  await expect(page.getByText(/예시:/)).toBeVisible();
});

test("3단 힌트는 팀 도전과 단계별 점수를 적용한다", async ({ page }) => {
  await openGame(page, "3단 힌트 퀴즈");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await expect(page.locator(".question-progress")).toContainText("1 / 2");
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await page.getByRole("button", { name: "A팀 도전" }).click();
  await page.getByRole("complementary", { name: "도전 판정" }).getByRole("button", { name: "정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("3");
});

test("선수 커리어는 전체 경력을 한 번에 공개하고 정답에 1점을 준다", async ({ page }) => {
  await openGame(page, "선수 커리어 맞히기");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.locator(".career-path > div").first()).toBeVisible();
  expect(await page.locator(".career-path > div").count()).toBeGreaterThan(1);
  await expect(page.getByRole("button", { name: "다음 단계" })).toHaveCount(0);
  await page.getByRole("button", { name: "A팀 도전" }).click();
  await page.getByRole("complementary", { name: "도전 판정" }).getByRole("button", { name: "정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("1");
  await expect(page.getByText("콘텐츠 출처·라이선스")).toBeVisible();
});

test("통합된 로고 확대 게임을 실행하고 세션을 복원한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByLabel("1번 팀 이름").fill("로고팀");
  await page.getByRole("button", { name: "게임 선택" }).click();

  await expect(page.getByRole("heading", { name: "음악 전주" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "이미지 확대" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "로고 확대 퀴즈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "영화 포스터" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "노래 그림" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "설명 금지어" })).toHaveCount(0);

  const logoCard = page.locator("article").filter({ hasText: "로고 확대 퀴즈" });
  await logoCard.getByRole("button", { name: "게임 안내" }).click();
  await expect(page.getByText(/로고의 좁은 영역부터/)).toBeVisible();
  await page.getByRole("button", { name: "게임 설정" }).click();
  await expect(page.getByText(/개 문제 사용 가능/)).toBeVisible();
  await page.locator(".advanced-settings").getByText("고급 설정").click();
  await page.getByLabel("라운드 문제 수").fill("2");
  await page.getByRole("button", { name: "라운드 시작" }).click();

  await expect(page.getByText("문제가 아직 공개되지 않았습니다")).toBeVisible();
  await expect(page.getByRole("img", { name: /로고 1단계/ })).toHaveCount(0);
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByRole("img", { name: /로고 1단계/ })).toBeVisible();
  await page.getByRole("button", { name: "다음 단계" }).click();
  await expect(page.getByRole("img", { name: /로고 2단계/ })).toBeVisible();
  await page.getByRole("button", { name: "로고팀 도전" }).click();
  await page.getByRole("button", { name: "정답", exact: true }).click();
  await expect(page.locator(".score-team").filter({ hasText: "로고팀" })).toContainText("2");
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "로고팀" })).toContainText("0");

  await page.reload();
  await expect(page.getByRole("heading", { name: "로고 확대 퀴즈" })).toBeVisible();
  await expect(page.getByRole("button", { name: "라운드 시작" })).toBeVisible();
});

test("음악 전주는 단계별 재생 구간과 판정을 제공한다", async ({ page }) => {
  await openGame(page, "음악 전주");
  await page.getByLabel("문제 순서").selectOption("data");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByText("전주 1초")).toBeVisible();
  await expect(page.getByRole("button", { name: "전주 재생" })).toBeVisible();
  await page.getByRole("button", { name: "다음 단계" }).click();
  await expect(page.getByText("전주 2초")).toBeVisible();
  await page.getByRole("button", { name: "A팀 도전" }).click();
  await page.getByRole("complementary", { name: "도전 판정" }).getByRole("button", { name: "정답" }).click();
  await expect(page.getByText("테스트 노래", { exact: true })).toBeVisible();
});

test("영화 포스터는 제목 마스크를 판정 전까지만 표시한다", async ({ page }) => {
  await openGame(page, "영화 포스터");
  await page.getByLabel("문제 순서").selectOption("data");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByRole("img", { name: "제목이 가려진 영화 포스터" })).toBeVisible();
  await expect(page.locator("span[class*='posterMask']")).toHaveCount(2);
  await page.getByRole("button", { name: "A팀 성공" }).click();
  await expect(page.locator("span[class*='posterMask']")).toHaveCount(0);
  await expect(page.getByText("픽스처 영화", { exact: true })).toBeVisible();
});

test("노래 그림은 직접 입력으로 자동 채점하고 정답 정보를 공개한다", async ({ page }) => {
  await openGame(page, "노래 그림");
  await page.getByLabel("정답 판정 방식").selectOption("direct_input");
  await page.getByLabel("문제 순서").selectOption("data");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByRole("img", { name: "노래 가사를 해석한 한 장의 그림" })).toBeVisible();
  await page.getByLabel("정답 입력").fill("그림 노래");
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("1");
  await expect(page.getByText("테스트 가수 · 초등학생 낙서")).toBeVisible();
});
