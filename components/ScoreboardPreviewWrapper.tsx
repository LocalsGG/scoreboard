"use client";

import { useState } from "react";
import { ScoreboardPreview } from "./ScoreboardPreview";
import { UndoRedoControls } from "./UndoRedoControls";
import type { ScoreboardPreviewProps } from "@/lib/types";

type Props = ScoreboardPreviewProps & {
  onUndoRedoReady?: (handlers: { onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }) => void;
};

export function ScoreboardPreviewWrapper(props: Props) {
  const [undoRedoHandlers, setUndoRedoHandlers] = useState<{
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  } | null>(null);

  const handleUndoRedoReady = (handlers: {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  }) => {
    setUndoRedoHandlers(handlers);
    if (props.onUndoRedoReady) {
      props.onUndoRedoReady(handlers);
    }
  };

  return (
    <>
      {undoRedoHandlers && !props.readOnly && (
        <UndoRedoControls
          onUndo={undoRedoHandlers.onUndo}
          onRedo={undoRedoHandlers.onRedo}
          canUndo={undoRedoHandlers.canUndo}
          canRedo={undoRedoHandlers.canRedo}
        />
      )}
      <ScoreboardPreview {...props} onUndoRedoReady={handleUndoRedoReady} />
    </>
  );
}
