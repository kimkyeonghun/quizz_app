import { expect, test } from "@playwright/test";

test("팀 설정부터 게임 판정과 Undo까지 진행한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 게임 시작" }).click();
  await page.getByLabel("1번 팀 이름").fill("레드팀");
  await page.getByRole("button", { name: "게임 선택" }).click();

  const charadesCard = page.locator("article").filter({ hasText: "몸으로 말해요" });
  await charadesCard.getByRole("button", { name: "설정 열기" }).click();
  await expect(page.getByText(/개 문제 사용 가능/)).toBeVisible();
  await page.getByRole("button", { name: "라운드 시작" }).click();

  await expect(page.getByText("레드팀 도전")).toBeVisible();
  await page.getByRole("button", { name: "레드팀 정답" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "레드팀" })).toContainText("1");
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".score-team").filter({ hasText: "레드팀" })).toContainText("0");
});
