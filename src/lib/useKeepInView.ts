import { useEffect } from "react";

export function useKeepInView(elementId: string | undefined): void {
  useEffect(() => {
    if (elementId) {
      document.getElementById(elementId)?.scrollIntoView({ block: "nearest" });
    }
  }, [elementId]);
}
