"use client";

import { motion } from "framer-motion";

type Props = {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function UndoRedoControls({ onUndo, onRedo, canUndo, canRedo }: Props) {
  return (
    <motion.div
      className="flex items-center gap-1 flex-shrink-0"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <div className="relative group">
        <motion.button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center justify-center rounded-lg border border-black/20 bg-white px-1.5 py-1 text-xs font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden relative"
          whileHover={canUndo ? {
            y: -2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: { duration: 0.2 }
          } : {}}
          whileTap={canUndo ? { scale: 0.9 } : {}}
          animate={canUndo ? {
            backgroundColor: "rgb(255, 255, 255)",
            borderColor: "rgba(0, 0, 0, 0.2)"
          } : {
            backgroundColor: "rgb(248, 250, 252)",
            borderColor: "rgba(0, 0, 0, 0.1)"
          }}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            whileHover={canUndo ? { rotate: -10 } : {}}
            transition={{ duration: 0.2 }}
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </motion.svg>

          {/* Pulse effect for enabled state */}
          {canUndo && (
            <motion.div
              className="absolute inset-0 bg-blue-100 rounded-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 0], opacity: [0, 0.3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            />
          )}
        </motion.button>
        <motion.div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-black/90 rounded whitespace-nowrap pointer-events-none z-50"
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          undo
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </motion.div>
      </div>

      <div className="relative group">
        <motion.button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center justify-center rounded-lg border border-black/20 bg-white px-1.5 py-1 text-xs font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden relative"
          whileHover={canRedo ? {
            y: -2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: { duration: 0.2 }
          } : {}}
          whileTap={canRedo ? { scale: 0.9 } : {}}
          animate={canRedo ? {
            backgroundColor: "rgb(255, 255, 255)",
            borderColor: "rgba(0, 0, 0, 0.2)"
          } : {
            backgroundColor: "rgb(248, 250, 252)",
            borderColor: "rgba(0, 0, 0, 0.1)"
          }}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            whileHover={canRedo ? { rotate: 10 } : {}}
            transition={{ duration: 0.2 }}
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
          </motion.svg>

          {/* Pulse effect for enabled state */}
          {canRedo && (
            <motion.div
              className="absolute inset-0 bg-green-100 rounded-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 0], opacity: [0, 0.3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                delay: 1
              }}
            />
          )}
        </motion.button>
        <motion.div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-black/90 rounded whitespace-nowrap pointer-events-none z-50"
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          redo
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </motion.div>
      </div>
    </motion.div>
  );
}
