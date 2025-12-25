"use client";

import { useState, useRef, useEffect } from "react";
import { DisplayScoreboardModal } from "./DisplayScoreboardModal";

type Props = {
  shareUrl: string;
  className?: string;
};

export function DisplayScoreboardButton({ shareUrl, className }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isModalOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const modalWidth = 448; // max-w-md = 28rem = 448px
      const spacing = 8;
      
      // Center the modal below the button
      let left = rect.left + window.scrollX + (rect.width / 2) - (modalWidth / 2);
      
      // Ensure it doesn't go off the left edge
      if (left < window.scrollX + 16) {
        left = window.scrollX + 16;
      }
      
      // Ensure it doesn't go off the right edge
      const maxLeft = window.scrollX + window.innerWidth - modalWidth - 16;
      if (left > maxLeft) {
        left = maxLeft;
      }
      
      setPosition({
        top: rect.bottom + window.scrollY + spacing,
        left,
      });
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="relative group">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={className}
        >
          Display Scoreboard
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-black/90 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none z-50">
          add scoreboard to streaming software or public display
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </div>
      </div>
      {isModalOpen && position && (
        <DisplayScoreboardModal
          shareUrl={shareUrl}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          position={position}
        />
      )}
    </>
  );
}



