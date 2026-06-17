"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  type?: string;
  label?: string;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function VideoModal({
  open,
  onClose,
  src,
  type = "video/webm",
  label = "AgentFlow pipeline demo",
}: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Mount transition on open
  useEffect(() => {
    if (open) {
      // Remember what had focus before modal opened
      previousFocusRef.current = document.activeElement as HTMLElement;
      setMounted(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => {
        setMounted(false);
        // Return focus to the element that triggered the modal
        previousFocusRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Move focus into modal when it opens
  useEffect(() => {
    if (animate && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [animate]);

  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: Tab cycles through focusable elements inside the modal
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;

        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          // Shift+Tab: if at first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if at last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!mounted) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, handleKeyDown]);

  // Body scroll lock
  useEffect(() => {
    if (!mounted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mounted]);

  // Auto-play video when modal opens
  useEffect(() => {
    if (animate && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [animate]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} video`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Close button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        aria-label="Close video"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Video container */}
      <div
        className={`relative w-full max-w-5xl transition-all duration-300 ease-out ${
          animate
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95"
        }`}
      >
        <div className="overflow-hidden rounded-xl bg-black shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
            aria-label={label}
          >
            <source src={src} type={type} />
          </video>
        </div>
      </div>
    </div>
  );
}
