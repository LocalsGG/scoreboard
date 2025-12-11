"use client";

import { useEffect } from "react";

export default function ShareOverlayLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("share-overlay");
    document.body.classList.add("share-overlay");

    return () => {
      document.documentElement.classList.remove("share-overlay");
      document.body.classList.remove("share-overlay");
    };
  }, []);

  return children;
}
