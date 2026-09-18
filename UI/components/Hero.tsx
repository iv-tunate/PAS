"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Hero() {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    api
      .get<{ hero_video_url: string }>("/settings")
      .then((s) => setVideoUrl(s.hero_video_url))
      .catch(() => {
            });
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

  return (
    <section className="relative overflow-hidden">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Darkens the video so the text stays readable over it,
              in both themes. */}
          <div className="absolute inset-0 bg-ink/60" />
        </>
      ) : (
        // No video uploaded yet — an ambient glow effect fills in for
        // the background motion instead of a static, still hero.
        <div className="absolute inset-0 overflow-hidden">
          <span
            className="hero-glow"
            style={{
              width: 420,
              height: 420,
              top: "-10%",
              left: "5%",
              animationDelay: "0s",
              "--glow-color": "#1B3A5C",
            } as CSSProperties}
          />
          <span
            className="hero-glow"
            style={{
              width: 320,
              height: 320,
              top: "20%",
              right: "8%",
              animationDelay: "2.5s",
              "--glow-color": "#3E6690",
            } as CSSProperties}
          />
          <span
            className="hero-glow"
            style={{
              width: 260,
              height: 260,
              bottom: "-15%",
              left: "35%",
              animationDelay: "5s",
              "--glow-color": "#1B3A5C",
            } as CSSProperties}
          />
        </div>
      )}

      <div
        className={`relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 ${
          videoUrl ? "text-parchment" : ""
        }`}
      >
        <p className="text-sm tracking-wide text-accent-light mb-6 animate-fade-in-up">
          A sanctuary for growth &amp; focus
        </p>

        <h1
          className="font-display text-4xl md:text-6xl leading-[1.08] max-w-3xl animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          Timeless wisdom,
          <br />
          <span className={videoUrl ? "italic text-parchment/70" : "italic text-stone dark:text-stone-light"}>
            for a distracted mind
          </span>
        </h1>

        <p
          className={`mt-6 max-w-prose text-base md:text-lg leading-relaxed animate-fade-in-up ${
            videoUrl ? "text-parchment/80" : "text-stone dark:text-stone-light"
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          Step away from the noise of fleeting trends. Ground yourself in
          enduring biblical principles, quiet reflection, and structured
          study with Akintola Samuel — built for real, lasting change.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <a
            href={user ? "#courses" : "/signup"}
            className="inline-block px-6 py-3 rounded-full bg-accent text-parchment font-medium hover:bg-accent-light transition-colors"
          >
            Start studying
          </a>
          <p className={videoUrl ? "text-sm text-parchment/70" : "text-sm text-stone dark:text-stone-light"}>
            Instant classroom access. Join an active study circle.
          </p>

          {videoUrl && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={restartVideo}
                className="text-xs px-3 py-1.5 rounded-full border border-parchment/30 text-parchment/80 hover:border-parchment/60 transition-colors"
              >
                ↻ Restart
              </button>
              <button
                onClick={toggleSound}
                className="text-xs px-3 py-1.5 rounded-full border border-parchment/30 text-parchment/80 hover:border-parchment/60 transition-colors"
              >
                {muted ? "🔇 Tap for sound" : "🔊 Mute"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rule max-w-6xl mx-auto relative" />
    </section>
  );
}
