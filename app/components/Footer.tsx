import Image from "next/image";
import Link from "next/link";
import { 
  HiArrowRight, 
  HiEnvelope, 
  HiDocumentText, 
  HiBookOpen, 
  HiQuestionMarkCircle,
  HiNewspaper,
  HiUserGroup,
  HiPhone
} from "react-icons/hi2";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-black/5 bg-white/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.svg"
                  alt="Scoreboardtools"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-black text-black">Scoreboardtools</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Professional scoreboard overlays for esports streaming. Free to start, powerful enough for tournaments.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-lg hover:bg-zinc-800 transition-colors shadow-sm hover:shadow-md"
            >
              Create Free Account
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wide">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/integrations"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  href="/examples"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wide">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiDocumentText className="w-4 h-4" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiBookOpen className="w-4 h-4" />
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiQuestionMarkCircle className="w-4 h-4" />
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiNewspaper className="w-4 h-4" />
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wide">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiUserGroup className="w-4 h-4" />
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  <HiEnvelope className="w-4 h-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-zinc-600 hover:text-black transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 text-center sm:text-left">
            © {currentYear} Scoreboardtools. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-600 hover:text-black transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1 text-xs font-bold text-black hover:opacity-80 transition-opacity"
            >
              Get Started Free
              <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

