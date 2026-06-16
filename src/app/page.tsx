import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code } = await searchParams;

  if (code) {
    redirect(`/auth/callback?code=${code}&next=/reset-password`);
  }

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
        <div className="mt-0 bg-white rounded-2xl border border-stone-200 px-6 py-4 shadow-sm inline-flex flex-col items-center gap-3">
          <p className="text-stone-500 text-sm font-semibold self-start">Free Plan for a Limited Time:</p>
          <div className="flex items-center gap-5">
            {[['2','Roommates'],['3','Bills'],['3','Chores'],['3','Rules']].map(([num, label], i, arr) => (
              <>
                <div key={label} className="flex items-baseline gap-1.5">
                  <span className="font-bold text-stone-900 text-2xl leading-none">{num}</span>
                  <span className="text-stone-500 text-sm">{label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-px h-5 bg-stone-200" />}
              </>
            ))}
          </div>
          <p className="text-stone-400 text-sm">No credit card required.</p>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
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

      {/* Pricing */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-8">Simple pricing</h2>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col">
            <p className="text-sm font-semibold text-stone-500 mb-1">Free Plan for a Limited Time</p>
            <p className="text-3xl font-bold text-stone-900 mb-1">$0</p>
            <p className="text-stone-400 text-sm mb-6">No credit card required</p>
            <ul className="space-y-2 text-sm text-stone-600 mb-8 flex-1">
              <li>2 roommates</li>
              <li>3 bills</li>
              <li>3 chores</li>
              <li>3 house rules</li>
            </ul>
            <Link
              href="/signup"
              className="block text-center border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
            >
              Get started free
            </Link>
          </div>

          <div className="bg-emerald-500 rounded-2xl p-6 shadow-sm flex flex-col">
            <p className="text-sm font-semibold text-emerald-100 mb-1">Premium</p>
            <div className="flex items-baseline gap-1 mb-1">
              <p className="text-3xl font-bold text-white">$7.99</p>
              <p className="text-emerald-200 text-sm">/mo</p>
            </div>
            <p className="text-emerald-200 text-sm mb-6">or $59.99/year — save 37%</p>
            <ul className="space-y-2 text-sm text-emerald-50 mb-8 flex-1">
              <li>Unlimited roommates</li>
              <li>Unlimited bills</li>
              <li>Unlimited chores</li>
              <li>Unlimited house rules</li>
            </ul>
            <div className="space-y-2">
              <Link
                href="/signup?plan=monthly"
                className="block text-center bg-white hover:bg-stone-50 text-emerald-700 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                Buy monthly — $7.99/mo
              </Link>
              <Link
                href="/signup?plan=yearly"
                className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                Buy yearly — $59.99/yr
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 px-6 py-6 text-center text-stone-400 text-sm">
        © {new Date().getFullYear()} Roommate Peace
      </footer>
    </div>
  );
}
