"use client";

import { useState } from "react";
import { ReducedMotionVideo } from "@/components/reduced-motion-video";
import { VideoModal } from "@/components/video-modal";

export function HeroDemo() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Clickable video thumbnail */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group relative w-full max-w-4xl mx-auto mt-24 block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        aria-label="Open pipeline demo video"
      >
        <div className="relative overflow-hidden rounded-xl bg-white border border-surface-200 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:border-surface-300">
          <ReducedMotionVideo
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-auto block"
            aria-hidden="true"
          >
            <source src="/hero-demo.webm" type="video/webm" />
          </ReducedMotionVideo>
        </div>
      </button>

      {/* Fullscreen video modal */}
      <VideoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        src="/hero-demo.webm"
        type="video/webm"
        label="AgentFlow pipeline demo"
      />
    </>
  );
}
