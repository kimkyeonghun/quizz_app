import type { PlayableQuestion } from "../domain/types";

export type ValidationProfile = "fixture" | "production";

export interface ContentIssue {
  file: string;
  index?: number;
  questionId?: string;
  path?: string;
  code: string;
  message: string;
}

export interface QuestionBundle {
  questions: PlayableQuestion[];
  loadIssues: ContentIssue[];
  profile: ValidationProfile;
}

export interface QuestionSourceModule {
  profile: ValidationProfile;
  modules: Record<string, unknown>;
}

export interface ContentManifestFile {
  path: string;
  sha256: string;
  questionCount?: number;
  bytes?: number;
}

export interface ContentManifestV1 {
  schemaVersion: 1;
  generatedAt: string;
  files: ContentManifestFile[];
  assets: ContentManifestFile[];
}

export function formatContentIssue(issue: ContentIssue): string {
  const index = issue.index === undefined ? "" : `[${issue.index}]`;
  const path = issue.path ? ` ${issue.path}` : "";
  return `${issue.file}${index}${path}: ${issue.message}`;
}
