import type { PlayableQuestion } from "../domain/types";

export interface MediaPreflightFailure {
  questionId: string;
  asset: string;
  message: string;
}

export interface MediaPreflightResult {
  playable: PlayableQuestion[];
  failures: MediaPreflightFailure[];
}

export type AssetProbe = (question: PlayableQuestion) => Promise<void>;

function assetUrl(asset: string): string {
  if (/^(?:https?:|data:|blob:)/.test(asset)) return asset;
  return `${import.meta.env.BASE_URL}${asset.replace(/^\//, "")}`;
}

export const browserAssetProbe: AssetProbe = (question) => new Promise((resolve, reject) => {
  if (!question.asset) {
    resolve();
    return;
  }

  const timeout = window.setTimeout(() => reject(new Error("8초 안에 에셋을 불러오지 못했습니다.")), 8_000);
  const succeed = () => {
    window.clearTimeout(timeout);
    resolve();
  };
  const fail = () => {
    window.clearTimeout(timeout);
    reject(new Error("에셋을 불러올 수 없습니다."));
  };

  if (question.gameType === "music_intro") {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = succeed;
    audio.onerror = fail;
    audio.src = assetUrl(question.asset);
    audio.load();
  } else {
    const image = new Image();
    image.onload = succeed;
    image.onerror = fail;
    image.src = assetUrl(question.asset);
  }
});

export async function preflightQuestions(
  questions: PlayableQuestion[],
  probe: AssetProbe = browserAssetProbe,
): Promise<MediaPreflightResult> {
  const results = await Promise.all(questions.map(async (question) => {
    if (!question.asset) return { question };
    try {
      await probe(question);
      return { question };
    } catch (error) {
      return {
        question,
        failure: {
          questionId: question.id,
          asset: question.asset,
          message: (error as Error).message,
        },
      };
    }
  }));
  return {
    playable: results.filter((result) => !result.failure).map((result) => result.question),
    failures: results.flatMap((result) => result.failure ? [result.failure] : []),
  };
}
