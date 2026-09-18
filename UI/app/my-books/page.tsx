"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { forceDownloadUrl } from "@/lib/cloudinary";
import { useAuth } from "@/contexts/AuthContext";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  file_url: string;
};

export default function MyBooksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api.get<Book[]>("/my-books", true).then(setBooks).catch(() => {});
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl mb-10">My books</h1>

        {!books ? (
          <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
        ) : books.length === 0 ? (
          <p className="text-sm text-stone dark:text-stone-light">
            You haven&apos;t bought any books yet — browse the{" "}
            <a href="/books" className="text-accent-light hover:text-accent">
              books page
            </a>
            .
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
                  <p className="text-xs text-stone dark:text-stone-light mb-4">{book.author}</p>
                  <a
                    href={forceDownloadUrl(book.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
