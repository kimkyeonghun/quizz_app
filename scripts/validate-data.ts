import { scanData } from "./data-utils";
import { defaultConfig } from "../src/config/defaults";

void defaultConfig;
const result = scanData();

if (result.issues.length > 0) {
  console.error(`데이터 검증 실패: ${result.issues.length}건`);
  result.issues.forEach((issue) => {
    const location = issue.index === undefined ? issue.file : `${issue.file}[${issue.index}]`;
    console.error(`- ${location}: ${issue.message}`);
  });
  process.exitCode = 1;
} else {
  console.log(`데이터 검증 완료: ${result.files.length}개 파일, ${result.questions.length}개 문제`);
}
