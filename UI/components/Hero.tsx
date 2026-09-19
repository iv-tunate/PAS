"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_HERO_VIDEO } from "@/lib/demo-content";

type Course = { id: string; title: string };

export default function Hero() {
  const { user } = useAuth();
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [featured, setFeatured] = useState<Course[]>([]);
  const [email, setEmail] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    api
      .get<{ hero_video_url: string }>("/settings")
      .then((s) => setVideoUrl(s.hero_video_url))
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
    api
      .get<Course[]>("/courses")
      .then((courses) => setFeatured(courses.slice(0, 3)))
      .catch(() => {});
  }, []);

  function toggleSound() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  function restartVideo() {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
  }

  const displaySrc = videoUrl || DEMO_HERO_VIDEO;
  const isDemo = settingsLoaded && !videoUrl;

  function handleStartStudying(e: FormEvent) {
    e.preventDefault();
    if (user) {
      document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    router.push(`/signup${query}`);
  }

  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span
          className="hero-glow"
          style={{ width: 480, height: 480, top: "-15%", left: "-5%", animationDelay: "0s", "--glow-color": "#1B3A5C" } as CSSProperties}
        />
        <span
          className="hero-glow"
          style={{ width: 320, height: 320, top: "30%", left: "20%", animationDelay: "2.5s", "--glow-color": "#3E6690" } as CSSProperties}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        {/* Left column: copy + featured pills + email capture */}
        <div>
          <p className="text-sm tracking-wide text-accent-light mb-6 animate-fade-in-up">
            A sanctuary for growth &amp; focus
          </p>

          <h1
            className="font-display text-4xl md:text-6xl leading-[1.08] animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Timeless wisdom,
            <br />
            <span className="italic text-stone dark:text-stone-light">for a distracted mind</span>
          </h1>

          <p
            className="mt-6 max-w-prose text-base md:text-lg leading-relaxed text-stone dark:text-stone-light animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Step away from the noise of fleeting trends. Ground yourself in
            enduring biblical principles, quiet reflection, and structured
            study with Akintola Samuel — built for real, lasting change.
          </p>

          {featured.length > 0 && (
            <div
              className="mt-6 flex flex-wrap items-center gap-2 animate-fade-in-up"
              style={{ animationDelay: "0.25s" }}
            >
              <span className="text-xs tracking-wide text-stone dark:text-stone-light mr-1">
                FEATURED:
              </span>
              {featured.map((course) => (
                <a
                  key={course.id}
                  href="#courses"
                  className="text-xs px-3 py-1.5 rounded-full border border-current/15 hover:border-accent-light transition-colors"
                >
                  {course.title}
                </a>
              ))}
            </div>
          )}

          <form
            onSubmit={handleStartStudying}
            className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to begin your study…"
              className="flex-1 px-4 py-3 rounded-full border border-current/15 bg-transparent text-sm focus:border-accent outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors whitespace-nowrap"
            >
              Start studying
            </button>
          </form>

          <p
            className="mt-4 text-sm text-stone dark:text-stone-light animate-fade-in-up"
            style={{ animationDelay: "0.35s" }}
          >
            Instant classroom access. Sign up for an active discipleship circle.
          </p>
        </div>

        {/* Right column: always renders an actual, playing video — the
            real one once uploaded, the bundled demo clip until then. */}
        <div className="relative rounded-lg overflow-hidden aspect-[4/5] md:aspect-[3/4] border border-current/10">
          <video
            ref={videoRef}
            src={displaySrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {isDemo && user?.role === "admin" && (
            <a
              href="/admin/settings"
              className="absolute top-3 left-3 text-xs px-3 py-1.5 rounded-full bg-ink/50 text-parchment/90 hover:bg-ink/70 transition-colors backdrop-blur-sm"
            >
              Demo video — add yours in Site settings
            </a>
          )}

          <button
            onClick={restartVideo}
            className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full bg-ink/50 text-parchment/90 hover:bg-ink/70 transition-colors backdrop-blur-sm"
          >
            ↻ Restart
          </button>

          <button
            onClick={toggleSound}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-ink/50 text-parchment flex items-center justify-center hover:bg-ink/70 transition-colors backdrop-blur-sm"
            aria-label={muted ? "Click for sound" : "Mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {muted && (
            <span className="absolute inset-x-0 bottom-16 text-center text-xs tracking-wide text-parchment/90">
              CLICK FOR SOUND
            </span>
          )}

          <button
            onClick={toggleSound}
            className="absolute bottom-3 right-3 text-xs px-3 py-1.5 rounded-full bg-ink/50 text-parchment/90 hover:bg-ink/70 transition-colors backdrop-blur-sm"
          >
            {muted ? "🔇 Unmute" : "🔊 Mute"}
          </button>
        </div>
      </div>

      <div className="rule max-w-6xl mx-auto relative" />
    </section>
  );
}
