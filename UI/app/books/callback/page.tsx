"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function CallbackContent() {
  const searchParams = useSearchParams();
   const reference = searchParams.get("reference") || searchParams.get("tx_ref") || "";
  const cancelled = searchParams.get("cancelled") === "true";

  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");

  useEffect(() => {
    if (!reference || cancelled) {
      setStatus("failed");
      return;
    }
    api
      .get<{ status: string }>(`/books/verify/${reference}`, true)
      .then((res) => setStatus(res.status === "success" ? "success" : "failed"))
      .catch(() => setStatus("failed"));
  }, [reference, cancelled]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {status === "checking" && (
        <p className="text-sm text-stone dark:text-stone-light">Confirming your payment…</p>
      )}
      {status === "success" && (
        <>
          <h1 className="font-display text-2xl mb-3">Thank you</h1>
          <p className="text-sm text-stone dark:text-stone-light mb-6">
            Your purchase went through — a download link is on its way to
            your email, and it&apos;s available anytime under My books.
          </p>
          <Link
            href="/my-books"
            className="inline-block text-sm px-5 py-2.5 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
          >
            Go to My books
          </Link>
        </>
      )}
      {status === "failed" && (
        <>
          <h1 className="font-display text-2xl mb-3">Payment not completed</h1>
          <p className="text-sm text-stone dark:text-stone-light mb-6">
            {cancelled
              ? "You cancelled before finishing payment."
              : "We couldn't confirm this payment. If you were charged, contact us and we'll sort it out."}
          </p>
          <Link href="/books" className="text-sm text-accent-light hover:text-accent">
            Back to books
          </Link>
        </>
      )}
    </div>
  );
}

export default function BooksCallbackPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-24 text-center text-sm text-stone dark:text-stone-light">Loading…</div>}>
        <CallbackContent />
      </Suspense>
      <Footer />
    </>
  );
}
