"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Course payments" },
  { href: "/admin/book-purchases", label: "Book purchases" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/settings", label: "Site settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-stone dark:text-stone-light">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment dark:bg-ink">
      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[180px_1fr] gap-10">
        <aside>
          <Link href="/" className="text-sm text-stone dark:text-stone-light hover:text-accent">
            ← Back to site
          </Link>
          <nav className="mt-6 flex md:flex-col gap-1 flex-wrap">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm px-3 py-2 rounded-md hover:bg-parchment-raised dark:hover:bg-ink-raised transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
