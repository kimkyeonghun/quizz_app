import type { PlayableQuestion } from "../domain/types";
import { questionSchema } from "./schema";
import type { ContentIssue, QuestionBundle, QuestionSourceModule } from "./contentTypes";

function questionId(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("id" in value)) return undefined;
  return typeof value.id === "string" ? value.id : undefined;
}

export function parseQuestionSource(source: QuestionSourceModule): QuestionBundle {
  const questions: PlayableQuestion[] = [];
  const loadIssues: ContentIssue[] = [];

  for (const [file, content] of Object.entries(source.modules)) {
    if (!Array.isArray(content)) {
      loadIssues.push({ file, code: "INVALID_FILE_ROOT", message: "최상위 값은 배열이어야 합니다." });
      continue;
    }

    content.forEach((item, index) => {
      const result = questionSchema.safeParse(item);
      if (result.success) {
        questions.push(result.data as PlayableQuestion);
        return;
      }

      result.error.issues.forEach((issue) => {
        loadIssues.push({
          file,
          index,
          questionId: questionId(item),
          path: issue.path.join(".") || "question",
          code: issue.code.toUpperCase(),
          message: issue.message,
        });
      });
    });
  }

  return { questions, loadIssues, profile: source.profile };
}
