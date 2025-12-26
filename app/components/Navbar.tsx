import Image from "next/image";
import Link from "next/link";
import { HiBars3, HiXMark } from "react-icons/hi2";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <Image
              src="/logo.svg"
              alt="Scoreboardtools"
              fill
              sizes="(max-width: 640px) 32px, 40px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg sm:text-xl font-black text-black group-hover:opacity-80 transition-opacity">
            Scoreboardtools
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#how-it-works"
            className="text-sm font-semibold text-zinc-700 hover:text-black transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/features"
            className="text-sm font-semibold text-zinc-700 hover:text-black transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-zinc-700 hover:text-black transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-zinc-700 hover:text-black transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-zinc-800 transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile CTA */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

