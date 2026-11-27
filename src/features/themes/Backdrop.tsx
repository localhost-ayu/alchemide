import { useEffect, useRef } from "react";
import { useAssetUrl } from "./useAssetUrl";
import { useThemeStore } from "./useThemeStore";
import "./themes.css";

export function Backdrop() {
  const background = useThemeStore((state) => state.custom.background ?? state.theme.background);
  const animations = useThemeStore((state) => state.effects.animations);
  const media = background.type === "image" || background.type === "video" ? background : null;
  const url = useAssetUrl(media?.path ?? null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) {
      return;
    }
    if (animations) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [animations, url]);

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__layer" />
      {media && url && media.type === "image" && (
        <img className="backdrop__media" src={url} alt="" />
      )}
      {media && url && media.type === "video" && (
        <video
          ref={videoRef}
          className="backdrop__media"
          src={url}
          autoPlay={animations}
          loop
          muted
          playsInline
        />
      )}
    </div>
  );
}
