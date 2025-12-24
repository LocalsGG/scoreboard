"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScoreboardPreview } from "./ScoreboardPreview";
import { UndoRedoControls } from "./UndoRedoControls";
import type { ScoreboardPreviewProps } from "@/lib/types";

type UndoRedoHandlers = {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

type Props = ScoreboardPreviewProps & { isLocal?: boolean; isAuthenticated?: boolean };

export function ScoreboardWithControls(props: Props) {
  const [undoRedoHandlers, setUndoRedoHandlers] = useState<UndoRedoHandlers | null>(null);
  const prevStateRef = useRef<{ canUndo: boolean; canRedo: boolean } | null>(null);

  const handleUndoRedoReady = useCallback((handlers: UndoRedoHandlers) => {
    // Only update if canUndo/canRedo state changed
    const prevState = prevStateRef.current;
    if (
      !prevState ||
      prevState.canUndo !== handlers.canUndo ||
      prevState.canRedo !== handlers.canRedo
    ) {
      prevStateRef.current = {
        canUndo: handlers.canUndo,
        canRedo: handlers.canRedo,
      };
      setUndoRedoHandlers(handlers);
    }
  }, []);

  // Expose handlers to parent via custom event
  useEffect(() => {
    if (undoRedoHandlers) {
      window.dispatchEvent(
        new CustomEvent("undo-redo-ready", {
          detail: undoRedoHandlers,
        })
      );
    }
  }, [undoRedoHandlers]);

  return (
    <>
      <ScoreboardPreview {...props} onUndoRedoReady={handleUndoRedoReady} />
    </>
  );
}

// Export a component that renders just the controls
export function UndoRedoControlsWrapper() {
  const [handlers, setHandlers] = useState<UndoRedoHandlers | null>(null);

  useEffect(() => {
    const handleReady = (event: CustomEvent<UndoRedoHandlers>) => {
      setHandlers(event.detail);
    };

    window.addEventListener("undo-redo-ready", handleReady as EventListener);
    
    return () => {
      window.removeEventListener("undo-redo-ready", handleReady as EventListener);
    };
  }, []);

  // Show disabled controls while loading to maintain layout
  if (!handlers) {
    return (
      <UndoRedoControls
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
      />
    );
  }

  return (
    <UndoRedoControls
      onUndo={handlers.onUndo}
      onRedo={handlers.onRedo}
      canUndo={handlers.canUndo}
      canRedo={handlers.canRedo}
    />
  );
}
