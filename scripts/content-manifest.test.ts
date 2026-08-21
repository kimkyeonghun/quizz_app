import { describe, expect, it } from "vitest";
import { manifestDifferences } from "./content-manifest";

const base = {
  schemaVersion: 1 as const,
  generatedAt: "2026-08-21T00:00:00.000Z",
  files: [{ path: "data/questions.json", sha256: "a".repeat(64), questionCount: 2 }],
  assets: [{ path: "public/assets/image.svg", sha256: "b".repeat(64), bytes: 100 }],
};

describe("content manifest", () => {
  it("accepts matching data and asset entries", () => {
    expect(manifestDifferences(".", base, base)).toEqual([]);
  });

  it("reports changed hashes and missing files", () => {
    const actual = {
      ...base,
      files: [{ ...base.files[0], sha256: "c".repeat(64) }],
      assets: [],
    };
    expect(manifestDifferences(".", actual, base)).toEqual([
      "데이터 manifest 불일치: data/questions.json",
      "에셋 실제 파일 누락: public/assets/image.svg",
    ]);
  });
});
