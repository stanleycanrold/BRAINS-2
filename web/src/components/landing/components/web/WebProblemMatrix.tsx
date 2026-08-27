"use client";
import React from 'react';
import { X, Check } from 'lucide-react';

export const WebProblemMatrix: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-[#0d1117] text-[#ffffff] border-b border-[#30363d]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#58a6ff]">
            02 / The Mom-Test Standard
          </span>
          <span className="text-xs font-mono text-[#8b949e]">Past Behavior &gt; Hypotheticals</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Friends lie to be polite. <span className="text-[#58a6ff]">Past behavior tells the truth.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
            When you ask friends or colleagues if they would buy something, they say yes to be nice. We only ask about real time and money they spent in the past.
          </p>
        </div>

        {/* POSTER COMPARISON: THE POLITE LIE VS THE AUDITED TRUTH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* Box 1: The Trap */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#161b22] border border-[#f85149]/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#f85149]">
              <X className="w-4 h-4" />
              <span>What Most People Ask (Misleading)</span>
            </div>

            <div className="space-y-3">
              <p className="text-base sm:text-lg font-mono font-medium text-white italic">
                “If I built an app for this, would you buy it?”
              </p>
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e] space-y-1">
                <span className="text-[#f85149] font-bold block">The Dangerous Result:</span>
                <p>“Sounds great, I’d totally buy that!” — Compliments are free. When you launch months later, nobody buys.</p>
              </div>
            </div>
          </div>

          {/* Box 2: The Truth */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#161b22] border border-[#3fb950]/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#3fb950]">
              <Check className="w-4 h-4" />
              <span>What NexaBrains Asks (The Truth)</span>
            </div>

            <div className="space-y-3">
              <p className="text-base sm:text-lg font-mono font-medium text-white italic">
                “How did you solve this last week, and what did it cost you?”
              </p>
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e] space-y-1">
                <span className="text-[#3fb950] font-bold block">The Real Proof:</span>
                <p>“I spent 4 hours using messy workarounds and paid $80 for a tool that failed.” — Verified, active pain.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stat Ribbon */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs font-mono text-center sm:text-left">
          <span className="text-[#8b949e]">RULE #1:</span>
          <span className="text-white font-bold">Never ask people what they might want. Ask what they already paid to fix.</span>
        </div>
      </div>
    </section>
  );
};
