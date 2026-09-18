"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  price_kobo: number;
  price_usd_cents: number;
  is_published: boolean;
};

const emptyForm = {
  title: "",
  author: "Akintola Samuel",
  description: "",
  coverImageUrl: "",
  fileUrl: "",
  priceNaira: "0",
  priceDollars: "0",
  isPublished: true,
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get<Book[]>("/admin/books", true).then(setBooks).catch(() => {});
  }
  useEffect(load, []);

  function startEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      coverImageUrl: book.cover_image_url,
      fileUrl: book.file_url,
      priceNaira: String(book.price_kobo / 100),
      priceDollars: String(book.price_usd_cents / 100),
      isPublished: book.is_published,
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

  async function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file, "book-covers");
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch {
      setError("Cover upload failed — try a different image.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setError("");
    try {
      const url = await uploadToCloudinary(file, "books");
      setForm((f) => ({ ...f, fileUrl: url }));
    } catch {
      setError("Ebook upload failed — try a different file.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      author: form.author,
      description: form.description,
      cover_image_url: form.coverImageUrl,
      file_url: form.fileUrl,
      price_kobo: Math.round(parseFloat(form.priceNaira || "0") * 100),
      price_usd_cents: Math.round(parseFloat(form.priceDollars || "0") * 100),
      is_published: form.isPublished,
    };

    try {
      if (editingId === "new") {
        await api.post("/admin/books", payload, true);
      } else if (editingId) {
        await api.put(`/admin/books/${editingId}`, payload, true);
      }
      cancel();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save book.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this book? This can't be undone.")) return;
    try {
      await api.delete(`/admin/books/${id}`, true);
      load();
    } catch {
      setError("Could not delete that book.");
    }
  }

  const isEditing = editingId !== null;
  const uploading = uploadingCover || uploadingFile;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Books</h1>
        {!isEditing && (
          <button
            onClick={startNew}
            className="text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
          >
            New book
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
            <label className="block text-sm mb-1.5">Author</label>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none min-h-[5rem]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1.5">Price in Naira (Paystack / Flutterwave)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.priceNaira}
                onChange={(e) => setForm((f) => ({ ...f, priceNaira: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1.5">Price in USD (Stripe)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceDollars}
                onChange={(e) => setForm((f) => ({ ...f, priceDollars: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-current/15 bg-transparent focus:border-accent outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-stone dark:text-stone-light -mt-2">
            Leave a price at 0 to hide that payment option for this book.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            Published (visible on the site)
          </label>

          <div>
            <label className="block text-sm mb-1.5">Cover image</label>
            {form.coverImageUrl ? (
                <img src={form.coverImageUrl} alt="" className="w-32 aspect-[3/4] object-cover rounded-md mb-2" />
            ) : (
              <div className="w-32 aspect-[3/4] rounded-md mb-2 border border-dashed border-current/20 flex items-center justify-center text-xs text-stone dark:text-stone-light text-center px-2">
                No cover yet
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleCoverChange} disabled={uploadingCover} />
            {uploadingCover && <p className="text-xs text-stone dark:text-stone-light mt-1">Uploading…</p>}
          </div>

          <div>
            <label className="block text-sm mb-1.5">Ebook file (PDF, EPUB, etc.)</label>
            {form.fileUrl ? (
              <p className="text-xs text-accent-light mb-2 break-all">{form.fileUrl}</p>
            ) : (
              <p className="text-xs text-stone dark:text-stone-light mb-2">No file uploaded yet</p>
            )}
            <input type="file" onChange={handleFileChange} disabled={uploadingFile} />
            {uploadingFile && <p className="text-xs text-stone dark:text-stone-light mt-1">Uploading…</p>}
            <p className="text-xs text-stone dark:text-stone-light mt-1">
              This is the actual file buyers download — it&apos;s delivered by
              email and shown on their &quot;My books&quot; page after purchase.
            </p>
          </div>

          {error && <p className="text-sm text-wax">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || uploading || !form.title.trim()}
              className="text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save book"}
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

      {!books ? (
        <p className="text-sm text-stone dark:text-stone-light">Loading…</p>
      ) : books.length === 0 ? (
        <p className="text-sm text-stone dark:text-stone-light">
          No books yet — use &quot;New book&quot; above to add your first one.
        </p>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <div key={book.id} className="flex items-center justify-between p-4 rounded-lg border border-current/10">
              <div>
                <p className="font-medium">{book.title}</p>
                <p className="text-xs text-stone dark:text-stone-light">
                  {book.is_published ? "Published" : "Draft"} · ₦{(book.price_kobo / 100).toLocaleString()} /
                  ${(book.price_usd_cents / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(book)} className="text-accent-light hover:text-accent">
                  Edit
                </button>
                <button onClick={() => handleDelete(book.id)} className="text-stone dark:text-stone-light hover:text-wax">
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
