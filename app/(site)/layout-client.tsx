"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

interface SiteLayoutClientProps {
  children: React.ReactNode;
}

export function SiteLayoutClient({ children }: SiteLayoutClientProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <OAuthCallbackHandler />
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-black/5 bg-white/80 px-6 py-4 text-sm font-semibold backdrop-blur"
      >
        <div className="mx-auto w-full max-w-6xl">
          <Navbar />
        </div>
      </motion.header>
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="border-t border-black/5 bg-white/80 px-6 py-8 text-sm text-zinc-700 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 text-center">
          <span className="text-black">© 2025 LOCALS.GG</span>
          <p className="text-sm text-zinc-600">
            Modern tools for real-world gaming events and communities.
          </p>
          <p className="text-sm text-zinc-600">
            <a
              href="https://discord.gg/vS6gQZyNgT"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              Let us know what features we should add!
            </a>
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
