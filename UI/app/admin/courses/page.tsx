"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Chapter = { id: string; title: string; position: number };
type Course = {
  id: string;
  title: string;
  summary: string;
  price_kobo: number;
  is_published: boolean;
  thumbnail_url: string;
  chapters: Chapter[];
};

const emptyForm = {
  title: "",
  summary: "",
  priceNaira: "0",
  isPublished: true,
  thumbnailUrl: "",
  chapters: [""],
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get<Course[]>("/admin/courses", true).then(setCourses).catch(() => {});
  }

  useEffect(load, []);

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      summary: course.summary,
      priceNaira: String(course.price_kobo / 100),
      isPublished: course.is_published,
      thumbnailUrl: course.thumbnail_url,
      chapters: course.chapters.length ? course.chapters.map((c) => c.title) : [""],
    });
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
  }

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleThumbnailChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file, "courses");
      setForm((f) => ({ ...f, thumbnailUrl: url }));
    } catch {
      setError("Image upload failed — try a different file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      summary: form.summary,
      price_kobo: Math.round(parseFloat(form.priceNaira || "0") * 100),
      is_published: form.isPublished,
      thumbnail_url: form.thumbnailUrl,
      chapters: form.chapters.map((c) => c.trim()).filter(Boolean),
    };

    try {
      if (editingId === "new") {
        await api.post("/admin/courses", payload, true);
      } else if (editingId) {
        await api.put(`/admin/courses/${editingId}`, payload, true);
      }
      cancel();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save course.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course? This can't be undone.")) return;
    try {
      await api.delete(`/admin/courses/${id}`, true);
      load();
    } catch {
      setError("Could not delete that course.");
    }
  }

  const isEditing = editingId !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Courses</h1>
        {!isEditing && (
          <button
            onClick={startNew}
            className="text-sm px-4 py-2 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors"
          >
            New course
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mb-10 p-6 rounded-lg border border-current/10 space-y-4">
          <div>
            <label className="block text-sm mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5">Summary</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none min-h-[5rem]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1.5">Price (₦, 0 = free)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.priceNaira}
                onChange={(e) => setForm((f) => ({ ...f, priceNaira: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Published (visible on the site)
            </label>
          </div>

          <div>
            <label className="block text-sm mb-1.5">Thumbnail</label>
            {form.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.thumbnailUrl} alt="" className="w-40 aspect-video object-cover rounded-md mb-2" />
            ) : (
              <div className="w-40 aspect-video rounded-md mb-2 border border-dashed border-current/20 flex items-center justify-center text-xs text-stone dark:text-stone-light text-center px-2">
                No image yet
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleThumbnailChange} disabled={uploading} />
            {uploading && <p className="text-xs text-stone dark:text-stone-light mt-1">Uploading…</p>}
          </div>

          <div>
            <label className="block text-sm mb-1.5">Curriculum</label>
            <div className="space-y-2">
              {form.chapters.map((chapter, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={chapter}
                    onChange={(e) => {
                      const next = [...form.chapters];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, chapters: next }));
                    }}
                    placeholder={`Chapter ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none text-sm"
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, chapters: f.chapters.filter((_, idx) => idx !== i) }))
                    }
                    className="text-sm text-stone dark:text-stone-light hover:text-wax px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, chapters: [...f.chapters, ""] }))}
              className="mt-2 text-sm text-accent hover:text-accent-light"
            >
              + Add chapter
            </button>
          </div>

          {error && <p className="text-sm text-wax">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || uploading || !form.title.trim()}
              className="text-sm px-4 py-2 rounded-full bg-accent text-ink font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save course"}
            </button>
            <button
              onClick={cancel}
              className="text-sm px-4 py-2 rounded-full border border-current/20 hover:border-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!courses ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">
          No courses yet — use &quot;New course&quot; above to add your first one.
        </p>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-4 rounded-lg border border-current/10"
            >
              <div>
                <p className="font-medium">{course.title}</p>
                <p className="text-xs text-stone dark:text-stone-light">
                  {course.is_published ? "Published" : "Draft"} · ₦{(course.price_kobo / 100).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(course)} className="text-accent hover:text-accent-light">
                  Edit
                </button>
                <button onClick={() => handleDelete(course.id)} className="text-stone dark:text-stone-light hover:text-wax">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
