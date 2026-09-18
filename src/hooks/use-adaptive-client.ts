import { useEffect, useState } from "react";

export type AdaptiveClientMode = "mobile-portrait" | "mobile-landscape" | "tablet" | "desktop";

function detectMode(): AdaptiveClientMode {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const hoverless = window.matchMedia("(hover: none)").matches;

  const phoneSized = width <= 600 || (height <= 500 && width <= 932);
  if (phoneSized || ((coarse || hoverless) && width <= 932)) {
    return height >= width ? "mobile-portrait" : "mobile-landscape";
  }
  if (width <= 1180 || ((coarse || hoverless) && width <= 1366)) return "tablet";
  return "desktop";
}

export function useAdaptiveClient() {
  const [mode, setMode] = useState<AdaptiveClientMode>("desktop");

  useEffect(() => {
    const update = () => setMode(detectMode());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return {
    mode,
    isMobile: mode === "mobile-portrait" || mode === "mobile-landscape",
  };
}
