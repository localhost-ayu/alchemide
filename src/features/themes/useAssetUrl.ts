import { useEffect, useState } from "react";
import { assetUrl } from "../../lib/ipc";

export function useAssetUrl(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!path) {
      return;
    }
    let current = true;
    assetUrl(path)
      .then((resolved) => current && setUrl(resolved))
      .catch(() => current && setUrl(null));
    return () => {
      current = false;
    };
  }, [path]);

  return url;
}
