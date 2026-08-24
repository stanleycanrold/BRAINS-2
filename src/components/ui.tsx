import React, { useEffect, useRef, useState } from "react";

/* ---------- brand ---------- */

export function BrainMark({ size = 34, orbiting = true }: { size?: number; orbiting?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="BRAINS mark">
      <rect width="40" height="40" rx="9" fill="var(--bg1)" stroke="var(--line)" />
      <circle cx="20" cy="20" r="11" stroke="var(--line)" strokeWidth="1" />
      <g className={orbiting ? "animate-orbit" : undefined} style={{ transformBox: "fill-box" }}>
        <circle cx="20" cy="9" r="2.1" fill="var(--probe)" />
        <circle cx="29.5" cy="25.5" r="2.1" fill="var(--warn)" />
        <circle cx="10.5" cy="25.5" r="2.1" fill="var(--stop)" />
      </g>
      <circle cx="20" cy="20" r="4.2" fill="var(--go)" />
      <circle cx="20" cy="20" r="7.5" stroke="var(--go)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2.5 3.5" className={orbiting ? "animate-orbit-fast" : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrainMark size={compact ? 28 : 34} />
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight text-[var(--ink)]">
          BRAINS<span className="text-[var(--go)]">.</span>
        </span>
      )}
    </span>
  );
}

/* ---------- scroll reveal ---------- */

export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "article" | "li" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`reveal ${inView ? "is-in" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/* ---------- status + chips ---------- */

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--ink-faint)",
  researching: "var(--probe)",
  researched: "var(--probe)",
  validating: "var(--warn)",
  scored: "var(--warn)",
  go: "var(--go)",
  nogo: "var(--stop)",
  killed: "var(--ink-faint)",
};

export function StatusChip({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLOR[status] ?? "var(--ink-faint)";
  const live = status === "researching" || status === "scored" || status === "validating";
  return (
    <span className="chip" style={{ color: c, borderColor: `color-mix(in srgb, ${c} 45%, var(--line))`, background: `color-mix(in srgb, ${c} 9%, var(--bg2))` }}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "dot-live" : ""}`} style={{ background: c }} />
      {label}
    </span>
  );
}

/* ---------- verdict gauge ---------- */

export function VerdictGauge({ total, verdict, size = 190 }: { total: number; verdict?: "GO" | "NO-GO"; size?: number }) {
  const R = 78;
  const C = 2 * Math.PI * R;
  const arc = C * 0.75;
  const fill = arc * Math.min(1, total / 100);
  const color = verdict === "GO" ? "var(--go)" : verdict === "NO-GO" ? "var(--stop)" : "var(--probe)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 190 190" style={{ transform: "rotate(135deg)" }}>
        <circle cx="95" cy="95" r={R} fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arc} ${C}`} />
        <circle cx="95" cy="95" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${fill} ${C}`} className="gauge-arc" style={{ ["--gauge-full" as string]: `${arc}` }} />
        <circle cx="95" cy="95" r={62} fill="none" stroke="var(--line-soft)" strokeWidth="1" strokeDasharray="2 5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[44px] font-bold leading-none" style={{ color }}>
          {total}
        </span>
        <span className="font-mono mt-1 text-[10px] tracking-[0.2em] text-[var(--ink-faint)]">/ 100</span>
        {verdict && (
          <span className="font-mono mt-2 rounded px-2 py-0.5 text-[11px] font-semibold tracking-[0.18em]" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}>
            {verdict}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- pipeline stepper ---------- */

export const STAGE_META: Record<string, { n: string; name: string; desc: string }> = {
  describe: { n: "01", name: "Describe", desc: "One idea, one audience, one riskiest assumption." },
  research: { n: "02", name: "Research", desc: "Sourced market, competitor, signal and pricing intel." },
  validate: { n: "03", name: "Validate", desc: "Screened interviews with real respondents." },
  decide: { n: "04", name: "Decide", desc: "A 50% gate, enforced in code. GO or NO-GO." },
};

export function Stepper({ active, decided }: { active: string; decided?: "GO" | "NO-GO" }) {
  const order = ["describe", "research", "validate", "decide"];
  const idx = order.indexOf(active);
  return (
    <div className="grid grid-cols-4 gap-1">
      {order.map((s, i) => {
        const m = STAGE_META[s];
        const done = i < idx || (decided !== undefined && i <= idx);
        const current = i === idx;
        const col = s === "decide" && decided ? (decided === "GO" ? "var(--go)" : "var(--stop)") : current ? "var(--probe)" : done ? "var(--go)" : "var(--ink-faint)";
        return (
          <div key={s} className="relative px-3 py-3" style={{ background: current ? "var(--bg2)" : "transparent", borderLeft: i === 0 ? undefined : "1px solid var(--line-soft)" }}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px]" style={{ color: col }}>
                {m.n}
              </span>
              <span className={`font-display text-[13px] font-semibold ${current ? "" : "opacity-70"}`}>{m.name}</span>
            </div>
            <div className="mt-2 h-[3px] overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div className={`h-full rounded-full ${done || current ? "bar-grow" : ""}`} style={{ width: done ? "100%" : current ? "55%" : "0%", background: col }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- dimension bars ---------- */

export function DimensionBars({ dims, animate = true }: { dims: { label: string; score: number; weight: number; note: string }[]; animate?: boolean }) {
  return (
    <div className="space-y-4">
      {dims.map((d, i) => {
        const col = d.score >= 60 ? "var(--go)" : d.score >= 40 ? "var(--warn)" : "var(--stop)";
        return (
          <div key={d.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-medium">
                {d.label} <span className="font-mono text-[10px] text-[var(--ink-faint)]">×{d.weight}</span>
              </span>
              <span className="font-mono text-[13px] font-semibold" style={{ color: col }}>
                {d.score}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div className={`h-full rounded-full ${animate ? "bar-grow" : ""}`} style={{ width: `${d.score}%`, background: col, animationDelay: `${i * 90}ms` }} />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[var(--ink-dim)]">{d.note}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- toasts ---------- */

export function ToastHost({ toasts, dismiss }: { toasts: { id: string; msg: string; kind: string }[]; dismiss: (id: string) => void }) {
  const color: Record<string, string> = { ok: "var(--go)", warn: "var(--warn)", stop: "var(--stop)", info: "var(--probe)" };
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(380px,90vw)] flex-col gap-2">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismiss(t.id)} className="tick-in pointer-events-auto card flex items-start gap-3 px-4 py-3 text-left text-[13px]" style={{ borderColor: `color-mix(in srgb, ${color[t.kind]} 45%, var(--line))` }}>
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: color[t.kind] }} />
          <span className="leading-snug text-[var(--ink)]">{t.msg}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- misc ---------- */

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line-soft)] py-2.5 last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">{k}</span>
      <span className="text-right text-[13.5px] font-medium">{v}</span>
    </div>
  );
}

export function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
