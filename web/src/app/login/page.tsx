"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const unauthorizedError = searchParams.get("error") === "unauthorized";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-charcoal-mid rounded-2xl border border-charcoal-light">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-teal-light">Joy-Per&apos;s Hub</h1>
          <p className="text-cream-muted text-sm mt-2">Manager Dashboard</p>
        </div>

        {unauthorizedError && (
          <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">
            Access restricted to managers and admins.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-cream-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-charcoal-light border border-charcoal-light rounded-lg text-cream focus:outline-none focus:border-teal"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-charcoal-light border border-charcoal-light rounded-lg text-cream focus:outline-none focus:border-teal"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal hover:bg-teal-dark text-cream rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
