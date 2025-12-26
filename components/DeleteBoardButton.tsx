"use client";

import { useState, useTransition } from "react";

interface Props {
  boardId: string;
  deleteAction: (boardId: string) => Promise<void>;
}

export function DeleteBoardButton({ boardId, deleteAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAction(boardId);
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-zinc-600 transition-all duration-150 hover:bg-zinc-100 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-white bg-red-600 transition-all duration-150 hover:bg-red-700 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Deleting..." : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      disabled={isPending}
      className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-red-600 transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-50 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Delete
    </button>
  );
}






