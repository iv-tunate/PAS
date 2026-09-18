"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "study-journal-note";

const features = [
  {
    title: "Reflect & record",
    body: "Capture key takeaways, personal prayers, and action points as you listen.",
  },
  {
    title: "Total privacy",
    body: "Your notes are saved securely in your browser and never sent to a server.",
  },
  {
    title: "Active retention",
    body: "Writing while you listen builds the habit of active, lasting study.",
  },
];

export default function StudyJournal() {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setNote(stored);
    } catch {}
  }, []);

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {}
  }

  return (
    <section id="journal" className="max-w-6xl mx-auto px-6 py-24">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <p className="text-sm tracking-wide text-accent mb-3">
            Digital companion
          </p>
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Your study journal
          </h2>
          <p className="text-stone dark:text-stone-light max-w-prose mb-10">
            Learning is more than listening. As you study Akintola Samuel's
            teaching, write down your key takeaways, prayers, and daily
            goals — saved privately, right here in your browser.
          </p>

          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center shrink-0 text-accent text-sm">
                  ●
                </div>
                <div>
                  <h3 className="font-medium mb-1">{f.title}</h3>
                  <p className="text-sm text-stone dark:text-stone-light">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-parchment-raised dark:bg-ink-raised rounded-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">My private journal</h3>
            <span className="text-xs text-stone dark:text-stone-light">
              Private local sandbox
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write what stood out to you today..."
            className="flex-1 min-h-[12rem] resize-none bg-transparent border border-current/15 rounded-md p-4 text-sm leading-relaxed focus:border-accent outline-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-stone dark:text-stone-light">
              Your note is stored locally in this browser.
            </p>
            <button
              onClick={handleSave}
              className="text-sm px-4 py-2 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors"
            >
              {saved ? "Saved" : "Save note"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
