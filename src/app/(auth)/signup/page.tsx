"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const plan = searchParams.get("plan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const nextPath = invite
      ? `/invite/${invite}`
      : plan
      ? `/setup?plan=${plan}`
      : "/dashboard";
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
  }

  return (
    <>
      <div className="text-center mb-8">
        <p className="text-lg font-semibold text-stone-900 leading-snug mb-3">
          Stop roommate resentment before it turns into roommate drama.
        </p>
        <p className="text-stone-500 text-sm leading-relaxed">
          Roommate Peace helps college roommates and shared households stay clear on chores, bills, and house agreements before small problems become big arguments. For less than the cost of one late-night food order, everyone gets visible accountability, fewer awkward reminders, and a calmer place to live.
        </p>
      </div>

      {plan && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          {plan === "yearly"
            ? "Premium yearly selected — $59.99 USD/yr. You'll be taken to checkout after setup."
            : "Premium monthly selected — $7.99 USD/mo. You'll be taken to checkout after setup."}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <h2 className="text-xl font-semibold text-stone-900 mb-1">
        Create your account
      </h2>
      <p className="text-stone-500 text-sm mb-6">
        Set up your household in under 3 minutes
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@email.com"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && email && password && name && handleSignup()}
            placeholder="8+ characters"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading || !email || !password || !name}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-xs text-stone-400 text-center">
          Accounts that don't join or create a household within 24 hours are automatically removed.
        </p>
      </div>

      <p className="text-center text-stone-500 text-sm mt-6">
        Already have an account?{" "}
        <Link
          href={invite ? `/login?invite=${invite}` : plan ? `/login?plan=${plan}` : "/login"}
          className="text-emerald-600 hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
