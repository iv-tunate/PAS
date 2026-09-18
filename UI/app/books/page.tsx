"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string;
  price_kobo: number;
  price_usd_cents: number;
};

const gatewayOptions = [
  { id: "paystack", label: "Card / Bank (Paystack)", currency: "NGN" as const },
  { id: "flutterwave", label: "Card / Bank / Mobile Money (Flutterwave)", currency: "NGN" as const },
  { id: "stripe", label: "International card (Stripe)", currency: "USD" as const },
];

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`;
}
function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BooksPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[] | null>(null);
  const [checkoutFor, setCheckoutFor] = useState<Book | null>(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Book[]>("/books").then(setBooks).catch(() => {});
  }, []);

  function openCheckout(book: Book) {
    if (!user) {
      router.push("/signup");
      return;
    }
    setError("");
    setCheckoutFor(book);
  }

  async function buyWith(gateway: string) {
    if (!checkoutFor) return;
    setBuying(true);
    setError("");
    try {
      const data = await api.post<{ checkout_url: string }>(
        `/books/${checkoutFor.id}/checkout`,
        { gateway },
        true
      );
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start checkout — try a different payment method."
      );
      setBuying(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-sm tracking-wide text-accent-light mb-3">Books</p>
        <h1 className="font-display text-3xl md:text-4xl mb-10">
          Writing by Akintola Samuel
        </h1>

        {!books ? (
          <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
        ) : books.length === 0 ? (
          <p className="text-sm text-stone dark:text-stone-light">
            No books published yet — check back soon.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {books.map((book) => (
              <div key={book.id} className="rounded-lg overflow-hidden border border-current/10">
                {book.cover_image_url ? (
                    <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-parchment-raised dark:bg-ink-raised" />
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg mb-1">{book.title}</h3>
                  <p className="text-xs text-stone dark:text-stone-light mb-3">{book.author}</p>
                  <p className="text-sm text-stone dark:text-stone-light mb-4 line-clamp-3">
                    {book.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-accent-light">
                      {book.price_kobo > 0 ? formatNaira(book.price_kobo) : formatDollars(book.price_usd_cents)}
                    </p>
                    <button
                      onClick={() => openCheckout(book)}
                      className="text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {user && (
          <p className="mt-10 text-sm text-stone dark:text-stone-light">
            Already bought something?{" "}
            <Link href="/my-books" className="text-accent-light hover:text-accent">
              See your books
            </Link>
            .
          </p>
        )}
      </main>
      <Footer />

      {checkoutFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/60"
          onClick={() => !buying && setCheckoutFor(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-parchment dark:bg-ink-raised p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl mb-1">{checkoutFor.title}</h3>
            <p className="text-sm text-stone dark:text-stone-light mb-6">
              Choose how you&apos;d like to pay.
            </p>

            <div className="space-y-2">
              {gatewayOptions.map((g) => {
                const price = g.currency === "USD" ? checkoutFor.price_usd_cents : checkoutFor.price_kobo;
                const disabled = price <= 0;
                return (
                  <button
                    key={g.id}
                    onClick={() => buyWith(g.id)}
                    disabled={buying || disabled}
                    className="w-full text-left px-4 py-3 rounded-md border border-current/15 hover:border-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between text-sm"
                  >
                    <span>{g.label}</span>
                    <span className="text-stone dark:text-stone-light">
                      {disabled
                        ? "unavailable"
                        : g.currency === "USD"
                        ? formatDollars(price)
                        : formatNaira(price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-4 text-sm text-wax">{error}</p>}

            <button
              onClick={() => setCheckoutFor(null)}
              disabled={buying}
              className="mt-4 text-sm text-stone dark:text-stone-light hover:text-wax"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
