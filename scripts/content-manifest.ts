import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { z } from "zod";
import type { ContentManifestV1, ContentManifestFile } from "../src/data/contentTypes";
import type { PlayableQuestion } from "../src/domain/types";

const manifestFileSchema = z.object({
  path: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  questionCount: z.number().int().min(0).optional(),
  bytes: z.number().int().min(0).optional(),
}).strict();

export const contentManifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime(),
  files: z.array(manifestFileSchema),
  assets: z.array(manifestFileSchema),
}).strict();

export function portablePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

export function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function dataFileEntry(root: string, path: string): ContentManifestFile {
  const content = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return {
    path: portablePath(root, path),
    sha256: sha256(path),
    questionCount: Array.isArray(content) ? content.length : 0,
  };
}

function assetFileEntry(root: string, path: string): ContentManifestFile {
  return {
    path: portablePath(root, path),
    sha256: sha256(path),
    bytes: statSync(path).size,
  };
}

export function buildContentManifest(root: string, files: string[], questions: PlayableQuestion[]): ContentManifestV1 {
  const assets = [...new Set(questions.flatMap((question) => question.asset ? [resolve(root, "public", question.asset.replace(/^\//, ""))] : []))]
    .filter(existsSync)
    .sort();
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    files: files.sort().map((path) => dataFileEntry(root, path)),
    assets: assets.map((path) => assetFileEntry(root, path)),
  };
}

export function readContentManifest(root: string): ContentManifestV1 {
  const path = resolve(root, "data/content-manifest.json");
  return contentManifestSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

export function manifestDifferences(
  root: string,
  actual: ContentManifestV1,
  expected: ContentManifestV1,
): string[] {
  const issues: string[] = [];
  const compare = (label: string, actualEntries: ContentManifestFile[], expectedEntries: ContentManifestFile[]) => {
    const actualMap = new Map(actualEntries.map((entry) => [entry.path, entry]));
    const expectedMap = new Map(expectedEntries.map((entry) => [entry.path, entry]));
    for (const [path, entry] of actualMap) {
      const saved = expectedMap.get(path);
      if (!saved) issues.push(`${label} manifest 항목 누락: ${path}`);
      else if (saved.sha256 !== entry.sha256 || saved.questionCount !== entry.questionCount || saved.bytes !== entry.bytes) {
        issues.push(`${label} manifest 불일치: ${path}`);
      }
    }
    for (const path of expectedMap.keys()) {
      if (!actualMap.has(path)) issues.push(`${label} 실제 파일 누락: ${path}`);
    }
  };
  compare("데이터", actual.files, expected.files);
  compare("에셋", actual.assets, expected.assets);
  void root;
  return issues;
}
