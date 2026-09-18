"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } finally {
        setSent(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-parchment dark:bg-ink">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-2">Reset your password</h1>

        {sent ? (
          <p className="text-sm text-stone dark:text-stone-light">
            If that email is registered, a reset link is on its way. Check
            your inbox.
          </p>
        ) : (
          <>
            <p className="text-stone dark:text-stone-light text-sm mb-8">
              Enter your email and we&apos;ll send you a link to reset it.
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
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-stone dark:text-stone-light">
          <Link href="/login" className="text-accent hover:text-accent-light">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
