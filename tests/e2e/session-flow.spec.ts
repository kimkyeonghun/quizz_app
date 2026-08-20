import { expect, test, type Page } from "@playwright/test";

async function openGame(page: Page, label: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByRole("button", { name: "게임 선택" }).click();
  const card = page.locator("article").filter({ hasText: label });
  await card.getByRole("button", { name: "게임 안내" }).click();
  await page.getByRole("button", { name: "게임 설정" }).click();
  await expect(page.getByText(/개 문제 사용 가능/)).toBeVisible();
}

test("관리자 페이지에서 게임별 데이터와 로컬 전용 문제를 조회한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "문제 데이터 관리" }).click();
  await expect(page.getByRole("heading", { name: "문제 데이터 관리" })).toBeVisible();
  await expect(page.getByLabel("데이터 현황")).toContainText("684");
  await page.getByLabel("관리 이용 범위").selectOption("private");
  await expect(page.getByText("44개 표시")).toBeVisible();
  await page.getByLabel("문항 검색").fill("피카츄");
  await expect(page.getByLabel("인물 퀴즈 문제 목록")).toContainText("피카츄");
});

test("인물 퀴즈는 시작 전 사진을 숨기고 판정과 Undo를 함께 처리한다", async ({ page }) => {
  await openGame(page, "인물 퀴즈");
  await expect(page.locator(".question-count strong")).toHaveText("159");
  await page.getByLabel("로컬 전용 문제 포함").uncheck();
  await expect(page.locator(".question-count strong")).toHaveText("115");
  await page.getByLabel("로컬 전용 문제 포함").check();
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
  await expect(page.locator(".question-progress")).toContainText("2 / 120");
});

test("네 글자 이어말하기 직접 입력 모드는 같은 화면에서 자동 채점한다", async ({ page }) => {
  await openGame(page, "네 글자 이어말하기");
  await page.getByLabel("정답 판정 방식").selectOption("direct_input");
  await page.getByLabel("문제 순서").selectOption("data");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await expect(page.getByLabel("정답 입력")).toBeVisible();
  await page.getByLabel("정답 입력").fill("일석이조");
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "A팀" })).toContainText("1");
});

test("5초 안에 3개는 10문항 큐와 사회자 판정을 사용한다", async ({ page }) => {
  await openGame(page, "5초 안에 3개");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await expect(page.locator(".question-progress")).toContainText("1 / 10");
  await page.getByRole("button", { name: "문제 공개 · 시작" }).click();
  await page.getByRole("button", { name: "A팀 성공" }).click();
  await expect(page.getByText(/예시:/)).toBeVisible();
});

test("3단 힌트는 팀 도전과 단계별 점수를 적용한다", async ({ page }) => {
  await openGame(page, "3단 힌트 퀴즈");
  await page.getByRole("button", { name: "라운드 시작" }).click();
  await expect(page.locator(".question-progress")).toContainText("1 / 5");
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
