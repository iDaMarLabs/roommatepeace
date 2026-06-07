import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function LandingPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-serif font-bold text-stone-900 text-lg">Roommate Peace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-3xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight mb-6">
          Stop arguing about<br />chores and bills.
        </h1>
        <p className="text-lg text-stone-600 max-w-xl mb-10 leading-relaxed">
          Roommate Peace helps shared households stay clear on chores, bills, and house agreements before small problems become big arguments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-semibold px-8 py-3 rounded-xl transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
        <p className="text-stone-400 text-sm mt-6">Free plan: 2 roommates, 5 chores, 3 bills. No credit card required.</p>
      </main>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">Chore accountability</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Clear who is responsible for what, when it needs to be done, and whether it actually got done.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">Bill tracking</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Track shared bills and who owes what so money doesn't become another source of tension.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">House rules</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Set agreements everyone acknowledges so there's no "I didn't know" when things go sideways.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 px-6 py-6 text-center text-stone-400 text-sm">
        © {new Date().getFullYear()} Roommate Peace · $7/mo or $59/year per household
      </footer>
    </div>
  );
}
