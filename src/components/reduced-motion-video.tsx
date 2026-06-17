"use client";

import { useEffect, useRef } from "react";

/**
 * Pauses a video element when the user prefers reduced motion.
 * Falls back to a static view (video stays on first frame).
 */
export function ReducedMotionVideo(props: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleMotionPreference() {
      if (mq.matches) {
        video!.pause();
      } else {
        video!.play().catch(() => {});
      }
    }

    handleMotionPreference();
    mq.addEventListener("change", handleMotionPreference);
    return () => mq.removeEventListener("change", handleMotionPreference);
  }, []);

  return <video ref={videoRef} {...props} />;
}
