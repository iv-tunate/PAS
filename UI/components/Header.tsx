"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-parchment/80 dark:bg-ink/80 border-b border-current/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-lg tracking-tight">
          Grow with <span className="italic text-accent">Akintola Samuel</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#courses" className="hover:text-accent transition-colors">
            Courses
          </a>
          <a href="#books" className="hover:text-accent transition-colors">
            Books
          </a>
          <a href="#journal" className="hover:text-accent transition-colors">
            Study Notes
          </a>
          <a href="#philosophy" className="hover:text-accent transition-colors">
            Our Philosophy
          </a>
          {user && (
            <Link href="/my-books" className="hover:text-accent transition-colors">
              My books
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="hover:text-accent transition-colors">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <button
              onClick={logout}
              className="text-sm px-4 py-2 rounded-full border border-current/20 hover:border-accent transition-colors"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block text-sm px-4 py-2 rounded-full border border-current/20 hover:border-accent transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-2 rounded-full bg-accent text-ink hover:bg-accent-light transition-colors font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
