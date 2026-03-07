"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-charcoal-mid rounded-2xl border border-charcoal-light">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-teal-light">Joy-Per&apos;s Hub</h1>
          <p className="text-cream-muted text-sm mt-2">Change Your Password</p>
        </div>

        <p className="text-cream-muted text-sm mb-6">
          You must set a new password before continuing.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-cream-muted mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-charcoal-light border border-charcoal-light rounded-lg text-cream focus:outline-none focus:border-teal"
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cream-muted mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-charcoal-light border border-charcoal-light rounded-lg text-cream focus:outline-none focus:border-teal"
              placeholder="Re-enter password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal hover:bg-teal-dark text-cream rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>

        <button
          onClick={handleSignOut}
          className="w-full mt-4 text-center text-cream-muted text-sm hover:text-cream transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
