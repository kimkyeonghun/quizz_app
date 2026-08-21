import { useState } from "react";
import { ImageOff } from "lucide-react";
import styles from "./MediaFrame.module.css";

interface VisualAssetProps {
  asset?: string | null;
  alt: string;
  symbolId?: string;
  viewBox?: string;
}

function assetUrl(asset: string): string {
  return `${import.meta.env.BASE_URL}${asset.replace(/^\//, "")}`;
}

export function VisualAsset({ asset, alt, symbolId, viewBox = "0 0 100 100" }: VisualAssetProps) {
  const [failed, setFailed] = useState(!asset);
  const [retryKey, setRetryKey] = useState(0);

  if (failed || !asset) {
    return (
      <div className={styles.fallback} role="img" aria-label={alt}>
        <ImageOff size={58} aria-hidden="true" />
        <strong>이미지를 불러올 수 없습니다.</strong>
        <span>{alt}</span>
        {asset && <button type="button" onClick={() => { setFailed(false); setRetryKey((value) => value + 1); }}>다시 시도</button>}
      </div>
    );
  }

  if (symbolId) {
    const url = assetUrl(asset);
    return (
      <>
        <img key={retryKey} className={styles.assetProbe} src={url} alt="" aria-hidden="true" onError={() => setFailed(true)} />
        <svg className={styles.sprite} viewBox={viewBox} role="img" aria-label={alt}>
          <use href={`${url}#${symbolId}`} />
        </svg>
      </>
    );
  }

  if (viewBox !== "0 0 100 100") {
    const url = assetUrl(asset);
    return (
      <>
        <img key={retryKey} className={styles.assetProbe} src={url} alt="" aria-hidden="true" onError={() => setFailed(true)} />
        <svg className={styles.sprite} viewBox={viewBox} role="img" aria-label={alt}>
          <image href={url} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
        </svg>
      </>
    );
  }

  return <img key={retryKey} className={styles.image} src={assetUrl(asset)} alt={alt} onError={() => setFailed(true)} />;
}

export function MediaFrame({ children }: { children: React.ReactNode }) {
  return <div className={styles.frame}>{children}</div>;
}
