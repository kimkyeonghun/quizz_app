import { expect, test } from "@playwright/test";

test("팀 설정부터 게임 판정과 Undo까지 진행한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByLabel("1번 팀 이름").fill("레드팀");
  await page.getByRole("button", { name: "게임 선택" }).click();

  const charadesCard = page.locator("article").filter({ hasText: "몸으로 말해요" });
  await charadesCard.getByRole("button", { name: "게임 안내" }).click();
  await expect(page.getByRole("heading", { name: "진행 순서" })).toBeVisible();
  await page.getByRole("button", { name: "게임 설정" }).click();
  await expect(page.getByText(/개 문제 사용 가능/)).toBeVisible();
  await page.getByRole("button", { name: "라운드 시작" }).click();

  await expect(page.getByText("레드팀 도전")).toBeVisible();
  await page.getByRole("button", { name: "레드팀 정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "레드팀" })).toContainText("1");
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "레드팀" })).toContainText("0");
});

test("신규 로고 게임을 실행하고 세션을 복원한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByLabel("1번 팀 이름").fill("로고팀");
  await page.getByRole("button", { name: "게임 선택" }).click();

  await expect(page.getByRole("heading", { name: "음악 전주" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "이미지 확대" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "영화 포스터" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "노래 그림" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "설명 금지어" })).toHaveCount(0);

  const logoCard = page.locator("article").filter({ hasText: "로고 퀴즈" });
  await logoCard.getByRole("button", { name: "게임 안내" }).click();
  await expect(page.getByText(/로고가 어떤 브랜드인지/)).toBeVisible();
  await page.getByRole("button", { name: "게임 설정" }).click();
  await expect(page.getByText("12")).toBeVisible();
  await page.getByRole("button", { name: "라운드 시작" }).click();

  await expect(page.getByRole("img", { name: /로고/ })).toBeVisible();
  await page.getByRole("button", { name: "로고팀 정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "로고팀" })).toContainText("1");
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "로고팀" })).toContainText("0");

  await page.reload();
  await expect(page.getByRole("heading", { name: "로고 퀴즈" })).toBeVisible();
  await expect(page.getByRole("button", { name: "라운드 시작" })).toBeVisible();
});
