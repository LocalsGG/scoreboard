"use client";

type Props = {
  boardId: string;
};

export function ResetPositionsButton({ boardId }: Props) {
  const handleReset = () => {
    window.dispatchEvent(new CustomEvent(`reset-positions-${boardId}`));
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:border-black/40 hover:bg-white active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      Reset positions
    </button>
  );
}


