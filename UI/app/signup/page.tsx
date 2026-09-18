"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ApiError } from "@/contexts/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password needs to be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(fullName, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-parchment dark:bg-ink">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-2">Create your account</h1>
        <p className="text-stone dark:text-stone-light text-sm mb-8">
          Join the study circle.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>
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
            <label className="block text-sm mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
            <p className="mt-1 text-xs text-stone dark:text-stone-light">At least 8 characters.</p>
          </div>

          {error && <p className="text-sm text-wax">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone dark:text-stone-light">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-light">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
