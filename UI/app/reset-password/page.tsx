"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
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
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "That reset link may have expired — request a new one."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-wax">
        This link is missing its reset token. Request a new one from{" "}
        <Link href="/forgot-password" className="text-accent hover:text-accent-light">
          the reset page
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-sm text-accent">
        Password updated. Taking you to log in…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1.5">New password</label>
        <input
          type="password"
          required
          minLength={8}
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
        {submitting ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-parchment dark:bg-ink">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-8">Set a new password</h1>
         <Suspense fallback={<p className="text-sm text-stone dark:text-stone-light">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
