"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { ReducedMotionVideo } from "@/components/reduced-motion-video";
import { VideoModal } from "@/components/video-modal";

export function HeroDemo() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Clickable video thumbnail with play button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group relative w-full max-w-4xl mx-auto mt-24 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        aria-label="Open pipeline demo video"
      >
        <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl transition-all duration-300 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] group-hover:border-white/20">
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

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
              <Play className="h-7 w-7 text-surface-900 ml-1" fill="currentColor" />
            </div>
          </div>
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
