import Link from "next/link";
import { Home } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-4 border-b border-stone-200">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500">
              <Home size={14} className="text-white" />
            </div>
            <span className="font-serif font-bold text-stone-900 group-hover:text-stone-600 transition-colors">
              Roommate Peace
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <footer className="px-6 py-6 border-t border-stone-200 text-center text-xs text-stone-400">
        © 2026 iDaMar Labs LLC{' '}·{' '}
        <Link href="/terms" className="underline hover:text-stone-600">Terms of Service</Link>
        {' '}·{' '}
        <Link href="/privacy" className="underline hover:text-stone-600">Privacy Policy</Link>
      </footer>
    </div>
  );
}
