"use client";

import { useState, useTransition, useEffect, useRef } from "react";

interface Props {
  boardId: string;
  boardName: string | null;
  deleteAction: (boardId: string) => Promise<void>;
}

export function DeleteBoardButton({ boardId, boardName, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showConfirm) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirm(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setShowConfirm(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showConfirm]);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAction(boardId);
      setShowConfirm(false);
    });
  };

  const boardLabel = boardName || "this scoreboard";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-red-600 transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-50 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white/95 p-6 shadow-[0_22px_65px_rgba(12,18,36,0.12)] backdrop-blur animate-rise"
          >
            <h3 className="text-xl font-semibold text-black mb-2">
              Delete Scoreboard?
            </h3>
            <p className="text-sm text-zinc-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">&quot;{boardLabel}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-150 hover:-translate-y-0.5 hover:bg-zinc-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-600 transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


