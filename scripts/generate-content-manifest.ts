import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildContentManifest } from "./content-manifest";
import { scanData } from "./data-utils";

const rootArgument = process.argv.find((argument) => argument.startsWith("--root="))?.slice("--root=".length);
const root = resolve(rootArgument ?? ".");
const result = await scanData({ root, profile: root.includes("tests\\fixtures") || root.includes("tests/fixtures") ? "fixture" : "production", verifyManifest: false });
if (result.issues.some((issue) => issue.code !== "CONTENT_REQUIREMENT")) {
  console.error("manifest 생성 전 데이터 오류를 해결해야 합니다.");
  process.exitCode = 1;
} else {
  const manifest = buildContentManifest(root, result.files, result.questions);
  const output = resolve(root, "data/content-manifest.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`콘텐츠 manifest 생성: ${output}`);
}
