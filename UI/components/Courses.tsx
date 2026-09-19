"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_COURSE_THUMBNAIL } from "@/lib/demo-content";

type Chapter = { id: string; title: string; position: number };
type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  price_kobo: number;
  thumbnail_url: string;
  chapters: Chapter[];
};

function formatNaira(kobo: number) {
  if (kobo === 0) return "Free";
  return `₦${(kobo / 100).toLocaleString()}`;
}

export default function Courses() {
  const { user } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [previewing, setPreviewing] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function scrollByCards(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  }

  function updateScrollEdges() {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  useEffect(() => {
    api
      .get<Course[]>("/courses")
      .then(setCourses)
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Could not load courses right now.")
      );
  }, []);

  useEffect(() => {
      updateScrollEdges();
  }, [courses]);

  useEffect(() => {
    if (!user) {
      setEnrolledIds(new Set());
      return;
    }
    api
      .get<string[]>("/my-enrollments", true)
      .then((ids) => setEnrolledIds(new Set(ids)))
      .catch(() => {});
  }, [user]);

   function handlePreviewClick(course: Course) {
    if (!user) {
      router.push("/signup");
      return;
    }
    setPreviewing(course);
  }

  async function handleEnroll(course: Course) {
    setActionError("");

    if (!user) {
      router.push("/signup");
      return;
    }

    setEnrolling(course.id);
    try {
      if (course.price_kobo === 0) {
        await api.post(`/courses/${course.id}/enroll-free`, undefined, true);
        setEnrolledIds((prev) => new Set(prev).add(course.id));
      } else {
        const data = await api.post<{ authorization_url: string }>(
          "/payments/initialize",
          { course_id: course.id },
          true
        );
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong — try again.");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <section id="courses" className="max-w-6xl mx-auto px-6 py-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-wide text-accent-light mb-3">Our courses</p>
          <h2 className="font-display text-3xl md:text-4xl max-w-xl">
            Deepen your faith and understanding
          </h2>
          <p className="mt-4 max-w-prose text-stone dark:text-stone-light">
            Learn at your own pace through structured, biblically grounded
            courses taught by Akintola Samuel.
          </p>
        </div>

        {courses && courses.length > 3 && (
          <div className="hidden sm:flex gap-2 shrink-0 mt-1">
            <button
              onClick={() => scrollByCards(-1)}
              disabled={atStart}
              aria-label="Scroll courses left"
              className="w-9 h-9 rounded-full border border-current/20 hover:border-accent-light flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:border-current/20"
            >
              ‹
            </button>
            <button
              onClick={() => scrollByCards(1)}
              disabled={atEnd}
              aria-label="Scroll courses right"
              className="w-9 h-9 rounded-full border border-current/20 hover:border-accent-light flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:border-current/20"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {loadError && <p className="mt-10 text-sm text-wax">{loadError}</p>}

      {!loadError && !courses && (
        <p className="mt-10 text-sm text-stone dark:text-stone-light">Loading courses…</p>
      )}

      {courses && courses.length === 0 && (
        <div className="mt-12 border border-dashed border-current/20 rounded-lg p-10 text-center">
          <p className="font-display text-lg mb-2">No courses published yet</p>
          <p className="text-sm text-stone dark:text-stone-light max-w-sm mx-auto">
            Once a course is added from the admin dashboard, it will show up
            right here — with its thumbnail, price, and curriculum, ready to
            preview and enroll in.
          </p>
          {user?.role === "admin" && (
            <Link
              href="/admin/courses"
              className="inline-block mt-5 text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
            >
              Add your first course
            </Link>
          )}
        </div>
      )}

      {courses && courses.length > 0 && (
        <>
          <div
            ref={scrollerRef}
            onScroll={updateScrollEdges}
            className="mt-12 flex gap-px bg-current/10 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {courses.map((course, i) => (
              <div
                key={course.id}
                className="bg-parchment dark:bg-ink shrink-0 w-[85%] sm:w-[340px] snap-start"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.thumbnail_url || DEMO_COURSE_THUMBNAIL}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />

                <div className="p-6">
                  <p className="text-xs tracking-wide text-stone dark:text-stone-light mb-2">
                    COURSE {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-xl mb-2">{course.title}</h3>
                  <p className="text-sm text-stone dark:text-stone-light mb-4">
                    {course.summary}
                  </p>
                  <p className="text-sm text-accent-light mb-4">{formatNaira(course.price_kobo)}</p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePreviewClick(course)}
                      className="text-sm text-accent-light hover:text-accent"
                    >
                      Preview course
                    </button>
                    <button
                      onClick={() => handleEnroll(course)}
                      disabled={enrolling === course.id || enrolledIds.has(course.id)}
                      className="ml-auto text-sm px-4 py-2 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
                    >
                      {enrolledIds.has(course.id)
                        ? "Enrolled"
                        : enrolling === course.id
                        ? "Please wait…"
                        : course.price_kobo === 0
                        ? "Enroll free"
                        : "Buy course"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {actionError && <p className="mt-4 text-sm text-wax">{actionError}</p>}
        </>
      )}

      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/60"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-parchment dark:bg-ink-raised p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display text-2xl">{previewing.title}</h3>
              <button
                onClick={() => setPreviewing(null)}
                className="text-stone dark:text-stone-light hover:text-wax text-sm"
              >
                Close
              </button>
            </div>

            <p className="text-sm text-stone dark:text-stone-light mb-6">{previewing.summary}</p>

            <p className="text-sm text-accent-light mb-2">Curriculum</p>
            {previewing.chapters.length === 0 ? (
              <p className="text-sm text-stone dark:text-stone-light">Curriculum coming soon.</p>
            ) : (
              <ol className="space-y-2 mb-6">
                {previewing.chapters.map((chapter, idx) => (
                  <li key={chapter.id} className="flex gap-3 text-sm">
                    <span className="text-stone dark:text-stone-light w-5 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span>{chapter.title}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-current/10">
              <p className="text-sm text-accent-light">{formatNaira(previewing.price_kobo)}</p>
              <button
                onClick={() => {
                  const course = previewing;
                  setPreviewing(null);
                  handleEnroll(course);
                }}
                disabled={enrolledIds.has(previewing.id)}
                className="text-sm px-5 py-2.5 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
              >
                {enrolledIds.has(previewing.id)
                  ? "Enrolled"
                  : previewing.price_kobo === 0
                  ? "Enroll free"
                  : "Buy course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
