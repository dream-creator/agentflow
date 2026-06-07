'use client';

import { useEffect, useRef } from 'react';

// --- constants ---
const STATS = [
  {
    id: 'agents',
    target: 47,
    suffix: '+',
    unit: null,
    label: 'Solo agents',
    liveUpdate: true,
    liveRange: [1, 2] as [number, number],
    duration: 1400,
    delay: 0,
    formatter: undefined,
  },
  {
    id: 'leads',
    target: 2400,
    suffix: '+',
    unit: null,
    label: 'Leads tracked',
    liveUpdate: true,
    liveRange: [10, 25] as [number, number],
    duration: 1800,
    delay: 100,
    formatter: formatLeads,
  },
  {
    id: 'rate',
    target: 98,
    suffix: '%',
    unit: null,
    label: 'Follow-up rate',
    liveUpdate: false,
    liveRange: null,
    duration: 1600,
    delay: 200,
    formatter: undefined,
  },
  {
    id: 'setup',
    target: 3,
    suffix: null,
    unit: 'min',
    label: 'Daily setup',
    liveUpdate: false,
    liveRange: null,
    duration: 900,
    delay: 300,
    formatter: undefined,
  },
] as const;

// --- helpers ---
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function animateCount(
  el: HTMLElement,
  target: number,
  duration: number,
  formatter?: (n: number) => string
) {
  const start = performance.now();
  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const current = Math.round(eased * target);
    el.textContent = formatter ? formatter(current) : String(current);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = formatter ? formatter(target) : String(target);
  }
  requestAnimationFrame(tick);
}

function formatLeads(n: number): string {
  if (n >= 1000) {
    const thousands = n / 1000;
    return thousands % 1 === 0
      ? `${thousands},000`
      : `${thousands.toFixed(1).replace('.0', '')},000`;
  }
  return String(n);
}

// --- component ---
export default function StatsBar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const countRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const liveValues = useRef<Record<string, number>>({ agents: 47, leads: 2400 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // 1. IntersectionObserver for count-up
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;

            STATS.forEach((stat) => {
              const el = countRefs.current[stat.id];
              if (!el) return;

              if (prefersReducedMotion) {
                // Show final value immediately
                const formatter = stat.formatter as ((n: number) => string) | undefined;
                el.textContent = formatter
                  ? formatter(stat.target)
                  : String(stat.target);
              } else {
                // Animate with staggered delay
                setTimeout(() => {
                  animateCount(
                    el,
                    stat.target,
                    stat.duration,
                    stat.formatter as ((n: number) => string) | undefined
                  );
                }, stat.delay);
              }
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // 2. setInterval for live ticks (every 4 seconds)
    const liveInterval = setInterval(() => {
      // Pick ONE liveUpdate stat at random
      const liveStats = STATS.filter((s) => s.liveUpdate);
      const chosen = liveStats[Math.floor(Math.random() * liveStats.length)];
      const el = countRefs.current[chosen.id];
      if (!el) return;

      const oldValue = liveValues.current[chosen.id];
      const [min, max] = chosen.liveRange!;
      const increment = Math.floor(Math.random() * (max - min + 1)) + min;
      const newValue = oldValue + increment;
      liveValues.current[chosen.id] = newValue;

      if (prefersReducedMotion) {
        // Set value instantly, no flash
        el.textContent = formatLeads(newValue);
      } else {
        // Animate over 12 frames using easeOutQuart
        const frameCount = 12;
        let frame = 0;
        const animateFrame = () => {
          frame++;
          const progress = Math.min(frame / frameCount, 1);
          const eased = easeOutQuart(progress);
          const current = Math.round(oldValue + (newValue - oldValue) * eased);
          if (el) el.textContent = formatLeads(current);
          if (progress < 1) {
            requestAnimationFrame(animateFrame);
          } else {
            // Flash effect
            if (el) el.classList.add('stats-flash');
            setTimeout(() => el?.classList.remove('stats-flash'), 400);
          }
        };
        requestAnimationFrame(animateFrame);
      }
    }, 4000);

    // 3. Cleanup
    return () => {
      observer.disconnect();
      clearInterval(liveInterval);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="AgentFlow usage statistics"
      className="border-y border-surface-200 bg-gradient-to-b from-surface-50 to-surface-100 py-12 px-6"
    >

      {/* Live badge */}
      <div className="flex justify-center mb-5">
        <span
          aria-label="Live statistics, updating in real time"
          className="inline-flex items-center gap-[5px] bg-success-50 border border-success-100 rounded-full px-2.5 py-[3px] text-[11px] font-semibold text-success tracking-wide"
        >
          {/* Pulse dot */}
          <span
            aria-hidden="true"
            className="stats-pulse-dot relative inline-block w-[7px] h-[7px] bg-success-500 rounded-full shrink-0"
          />
          LIVE STATS
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 max-w-[860px] mx-auto">
        {STATS.map((stat, index) => (
          <div
            key={stat.id}
            role="group"
            aria-label={stat.label}
            className="relative text-center px-6"
          >
            {/* Divider (desktop only, not after last) */}
            {index < STATS.length - 1 && (
              <div
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-surface-200"
                aria-hidden="true"
              />
            )}

            {/* Stat number */}
            <div className="flex items-baseline justify-center gap-px mb-1.5">
              <span
                ref={(el) => { countRefs.current[stat.id] = el; }}
                aria-live="polite"
                aria-atomic="true"
                className="text-3xl md:text-4xl font-bold text-surface-900 tracking-tight leading-none font-sans"
              >
                {stat.formatter
                  ? stat.formatter(stat.target)
                  : String(stat.target)}
              </span>

              {/* Suffix (+, %) */}
              {stat.suffix && (
                <span className="text-2xl md:text-[28px] font-semibold text-surface-900 leading-none">
                  {stat.suffix}
                </span>
              )}

              {/* Unit (min) */}
              {stat.unit && (
                <span className="text-[20px] font-medium text-surface-500 ml-0.5">
                  {stat.unit}
                </span>
              )}

              {/* Empty suffix placeholder for alignment */}
              {!stat.suffix && !stat.unit && (
                <span className="text-[28px] invisible">
                  +
                </span>
              )}
            </div>

            {/* Stat label */}
            <div className="text-sm text-surface-500 font-normal">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
