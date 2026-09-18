"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string;
  price_kobo: number;
  price_usd_cents: number;
};

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    api.get<Book[]>("/books").then(setBooks).catch(() => {});
  }, []);

  if (books && books.length === 0 && user?.role !== "admin") {
       return null;
  }

  return (
    <section id="books" className="max-w-6xl mx-auto px-6 py-24">
      <p className="text-sm tracking-wide text-accent-light mb-3">Books</p>
      <h2 className="font-display text-3xl md:text-4xl max-w-xl">
        Writing worth sitting with
      </h2>
      <p className="mt-4 max-w-prose text-stone dark:text-stone-light">
        Akintola Samuel&apos;s books, available to purchase and download
        instantly.
      </p>

      {!books ? (
        <p className="mt-10 text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : books.length === 0 ? (
        <div className="mt-10 border border-dashed border-current/20 rounded-lg p-10 text-center">
          <p className="font-display text-lg mb-2">No books published yet</p>
          <p className="text-sm text-stone dark:text-stone-light max-w-sm mx-auto mb-5">
            Add a title from the admin dashboard and it will appear here,
            ready to sell.
          </p>
          <Link
            href="/admin/books"
            className="inline-block text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
          >
            Add your first book
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.slice(0, 3).map((book) => (
              <Link
                key={book.id}
                href="/books"
                className="group block rounded-lg overflow-hidden border border-current/10 hover:border-accent-light transition-colors"
              >
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-parchment-raised dark:bg-ink-raised" />
                )}
                <div className="p-4">
                  <h3 className="font-display text-base group-hover:text-accent-light transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-stone dark:text-stone-light mt-1">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/books"
            className="inline-block mt-8 text-sm px-5 py-2.5 rounded-full border border-current/20 hover:border-accent-light transition-colors"
          >
            See more books
          </Link>
        </>
      )}
    </section>
  );
}
