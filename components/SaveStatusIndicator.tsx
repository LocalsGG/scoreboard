"use client";

import { useEffect, useRef, useState } from "react";

export function SaveStatusIndicator() {
  const [isSaving, setIsSaving] = useState(false);
  const saveCountRef = useRef(0);

  useEffect(() => {
    const handleSavingStart = () => {
      saveCountRef.current += 1;
      setIsSaving(true);
    };

    const handleSavingEnd = () => {
      saveCountRef.current = Math.max(0, saveCountRef.current - 1);
      if (saveCountRef.current === 0) {
        setIsSaving(false);
      }
    };

    // Listen for save events from all components
    window.addEventListener("scoreboard-saving-start", handleSavingStart);
    window.addEventListener("scoreboard-saving-end", handleSavingEnd);

    return () => {
      window.removeEventListener("scoreboard-saving-start", handleSavingStart);
      window.removeEventListener("scoreboard-saving-end", handleSavingEnd);
    };
  }, []);

  return (
    <div className="text-xs font-semibold text-black/60">
      {isSaving ? "Saving…" : "Saved"}
    </div>
  );
}




