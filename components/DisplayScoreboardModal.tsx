"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CopyButton } from "./CopyButton";

type Props = {
  shareUrl: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
};

export function DisplayScoreboardModal({ shareUrl, isOpen, onClose, position }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Small delay to avoid immediate close on click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed z-50 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Arrow pointing up */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-l border-t border-black/10 bg-white rotate-45"></div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 pr-8">
          Display Scoreboard
        </h2>

        <p className="text-sm text-gray-600">
          Use this link to display the scoreboard in streaming software or on a public display:
        </p>

        {/* Share URL Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Scoreboard Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <CopyButton
              value={shareUrl}
              label="Copy"
              showIcon={false}
              className="px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            How to use:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
            <li>Copy the link above</li>
            <li>Add it as a browser source in OBS, Streamlabs, or other streaming software</li>
            <li>Or open it in a browser window for public displays</li>
            <li>The scoreboard will update in real-time as you make changes</li>
          </ol>
        </div>

        {/* Open Link Button */}
        <div className="pt-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            onClick={onClose}
          >
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

