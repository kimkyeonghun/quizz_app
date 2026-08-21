import { scanData } from "./data-utils";
import { defaultConfig } from "../src/config/defaults";
import type { ValidationProfile } from "../src/data/contentTypes";
import { resolve } from "node:path";

void defaultConfig;
const profile = (process.argv.find((argument) => argument.startsWith("--profile="))?.slice("--profile=".length) ?? "production") as ValidationProfile;
const root = resolve(process.argv.find((argument) => argument.startsWith("--root="))?.slice("--root=".length) ?? ".");
const result = await scanData({ root, profile });

if (result.issues.length > 0) {
  console.error(`데이터 검증 실패: ${result.issues.length}건`);
  result.issues.forEach((issue) => {
    const location = issue.index === undefined ? issue.file : `${issue.file}[${issue.index}]`;
    const detail = [issue.questionId, issue.path, issue.code].filter(Boolean).join(" · ");
    console.error(`- ${location}${detail ? ` (${detail})` : ""}: ${issue.message}`);
  });
  process.exitCode = 1;
} else {
  console.log(`데이터 검증 완료: ${result.files.length}개 파일, ${result.questions.length}개 문제`);
}
