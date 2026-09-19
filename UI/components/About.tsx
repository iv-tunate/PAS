"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_PASTOR_PHOTO } from "@/lib/demo-content";

type Settings = {
  pastor_name: string;
  pastor_bio: string;
  pastor_photo_url: string;
  campuses_count: string;
  years_leadership: string;
  continents_reached: string;
  books_url: string;
  website_url: string;
  contact_email: string;
};

export default function About() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    api.get<Settings>("/settings").then(setSettings).catch(() => {  });
  }, []);

  if (!settings) return null;

  const stats = [
    { number: settings.campuses_count, label: "campuses worldwide" },
    { number: settings.years_leadership, label: "years of leadership" },
    { number: settings.continents_reached, label: "continents reached" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <p className="text-sm tracking-wide text-accent mb-3">Meet your guide</p>
      <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-12">
        <div>
           <img
            src={settings.pastor_photo_url || DEMO_PASTOR_PHOTO}
            alt={settings.pastor_name}
            className="aspect-[4/5] rounded-lg object-cover w-full"
          />
          <div className="mt-8 grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl text-accent">{s.number || "—"}</p>
                <p className="text-xs text-stone dark:text-stone-light mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl md:text-4xl mb-6">{settings.pastor_name}</h2>
          <p className="text-stone dark:text-stone-light leading-relaxed max-w-prose mb-8 whitespace-pre-line">
            {settings.pastor_bio || "Bio coming soon."}
          </p>

          {!settings.pastor_bio && user?.role === "admin" && (
            <Link
              href="/admin/settings"
              className="inline-block mb-8 -mt-4 text-sm text-accent-light hover:text-accent"
            >
              Add his bio and photo from Site settings →
            </Link>
          )}

          <div className="flex flex-wrap gap-6 text-sm">
            {settings.books_url && (
              <a href={settings.books_url} className="text-accent hover:text-accent-light transition-colors">
                Get his books
              </a>
            )}
            {settings.website_url && (
              <a href={settings.website_url} className="text-accent hover:text-accent-light transition-colors">
                {settings.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="text-accent hover:text-accent-light transition-colors">
                Contact
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
