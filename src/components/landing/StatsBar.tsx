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
        // Set value instantly
        el.textContent = formatLeads(newValue);
        // Flash effect
        el.classList.add('stats-flash');
        setTimeout(() => el.classList.remove('stats-flash'), 400);
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
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '48px 24px',
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes count-flash {
          0% { color: #0f766e; }
          100% { color: #0f172a; }
        }
        .stats-flash {
          animation: count-flash 0.4s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .stats-pulse-dot::before {
            animation: none !important;
          }
        }
      `}</style>

      {/* Live badge */}
      <div className="flex justify-center mb-5">
        <span
          aria-label="Live statistics, updating in real time"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#16a34a',
            letterSpacing: '0.04em',
          }}
        >
          {/* Pulse dot */}
          <span
            aria-hidden="true"
            className="stats-pulse-dot"
            style={{
              width: '7px',
              height: '7px',
              background: '#22c55e',
              borderRadius: '50%',
              position: 'relative',
              display: 'inline-block',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: '-3px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.3)',
                animation: 'pulse-ring 2s ease-out infinite',
              }}
            />
          </span>
          LIVE STATS
        </span>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{
          maxWidth: '860px',
          margin: '0 auto',
        }}
      >
        {STATS.map((stat, index) => (
          <div
            key={stat.id}
            role="group"
            aria-label={stat.label}
            className="relative"
            style={{
              textAlign: 'center',
              padding: '0 24px',
            }}
          >
            {/* Divider (desktop only, not after last) */}
            {index < STATS.length - 1 && (
              <div
                className="hidden md:block"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: '40px',
                  width: '1px',
                  background: '#e2e8f0',
                }}
              />
            )}

            {/* Stat number */}
            <div
              className="flex items-baseline justify-center"
              style={{ gap: '1px', marginBottom: '6px' }}
            >
              <span
                ref={(el) => { countRefs.current[stat.id] = el; }}
                aria-live="polite"
                aria-atomic="true"
                className="text-3xl md:text-4xl"
                style={{
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                }}
              >
                {stat.formatter
                  ? stat.formatter(stat.target)
                  : String(stat.target)}
              </span>

              {/* Suffix (+, %) */}
              {stat.suffix && (
                <span
                  className="text-2xl md:text-[28px]"
                  style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1,
                  }}
                >
                  {stat.suffix}
                </span>
              )}

              {/* Unit (min) */}
              {stat.unit && (
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    color: '#64748b',
                    marginLeft: '2px',
                  }}
                >
                  {stat.unit}
                  {/* Empty suffix placeholder for alignment */}
                </span>
              )}

              {/* Empty suffix placeholder for stats without suffix */}
              {!stat.suffix && !stat.unit && (
                <span style={{ fontSize: '28px', visibility: 'hidden' }}>
                  +
                </span>
              )}
            </div>

            {/* Stat label */}
            <div
              style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: 400,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
