"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await api.post("/newsletter/subscribe", { email });
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not subscribe — try again.");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-accent">You&apos;re on the list — thank you.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="text-sm px-4 py-2 rounded-md bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60 shrink-0"
        >
          {status === "loading" ? "…" : "Join"}
        </button>
      </div>
      {status === "error" && <p className="text-xs text-wax">{error}</p>}
    </form>
  );
}
