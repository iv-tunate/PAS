"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ApiError } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-parchment dark:bg-ink">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-2">Welcome back</h1>
        <p className="text-stone dark:text-stone-light text-sm mb-8">
          Log in to continue your study.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm">Password</label>
              <Link href="/forgot-password" className="text-xs text-accent hover:text-accent-light">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>

          {error && <p className="text-sm text-wax">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone dark:text-stone-light">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:text-accent-light">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
