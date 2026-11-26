import { useState } from "react";
import { isRemoteImage } from "./linkKind";

type PreviewImageProps = {
  src?: string;
  alt?: string;
};

export function PreviewImage({ src, alt }: PreviewImageProps) {
  const [allowed, setAllowed] = useState(false);
  const label = alt?.trim() || "image";

  if (src?.startsWith("data:image/") || (allowed && src)) {
    return <img src={src} alt={alt ?? ""} />;
  }
  if (isRemoteImage(src) && src) {
    return (
      <button type="button" className="preview-image__load" onClick={() => setAllowed(true)}>
        Load remote image “{label}” from {new URL(src).host}
      </button>
    );
  }
  return <span className="preview-image__placeholder">[{label}]</span>;
}
