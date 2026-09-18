"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
  hero_video_url: string;
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Settings>("/settings").then(setForm).catch(() => setError("Could not load settings."));
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file, "pastor-photo");
      set("pastor_photo_url", url);
    } catch {
      setError("Photo upload failed — try a different file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file, "hero-video");
      set("hero_video_url", url);
    } catch {
      setError("Video upload failed — try a different file, or a smaller one.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/admin/settings", form, true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return <p className="text-sm text-stone dark:text-stone-light">{error || "Loading…"}</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-8">Site settings</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm mb-1.5">Pastor&apos;s name</label>
          <input
            value={form.pastor_name}
            onChange={(e) => set("pastor_name", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5">Bio</label>
          <textarea
            value={form.pastor_bio}
            onChange={(e) => set("pastor_bio", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none min-h-[8rem]"
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5">Photo</label>
          {form.pastor_photo_url ? (
            <img
              src={form.pastor_photo_url}
              alt=""
              className="w-32 aspect-[4/5] object-cover rounded-md mb-2"
            />
          ) : (
            <div className="w-32 aspect-[4/5] rounded-md mb-2 border border-dashed border-current/20 flex items-center justify-center text-xs text-stone dark:text-stone-light text-center px-2">
              No photo yet
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} />
          {uploading && <p className="text-xs text-stone dark:text-stone-light mt-1">Uploading…</p>}
        </div>

        <div>
          <label className="block text-sm mb-1.5">Homepage background video</label>
          {form.hero_video_url ? (
            <video src={form.hero_video_url} className="w-48 aspect-video object-cover rounded-md mb-2" muted loop autoPlay playsInline />
          ) : (
            <div className="w-48 aspect-video rounded-md mb-2 border border-dashed border-current/20 flex items-center justify-center text-xs text-stone dark:text-stone-light text-center px-2">
              No video yet — showing the glow effect instead
            </div>
          )}
          <input type="file" accept="video/*" onChange={handleVideoChange} disabled={uploading} />
          <p className="text-xs text-stone dark:text-stone-light mt-1">
            Plays muted behind the homepage headline. Leave empty for a plain background.
          </p>
          {uploading && <p className="text-xs text-stone dark:text-stone-light mt-1">Uploading…</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Campuses</label>
            <input
              value={form.campuses_count}
              onChange={(e) => set("campuses_count", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Years leading</label>
            <input
              value={form.years_leadership}
              onChange={(e) => set("years_leadership", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Continents</label>
            <input
              value={form.continents_reached}
              onChange={(e) => set("continents_reached", e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5">Books link</label>
          <input
            value={form.books_url}
            onChange={(e) => set("books_url", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Website</label>
          <input
            value={form.website_url}
            onChange={(e) => set("website_url", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Contact email</label>
          <input
            value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
          />
        </div>

        {error && <p className="text-sm text-wax">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="text-sm px-5 py-2.5 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
