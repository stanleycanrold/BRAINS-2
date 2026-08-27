"use client";
import React from 'react';
import { Cpu, ArrowRight, Send, CheckCircle2, UserCheck, BarChart3 } from 'lucide-react';

export const WebValidationEngine: React.FC<{
  onOpenStudio: () => void;
  onOpenIdeaComposer: () => void;
}> = ({ onOpenStudio, onOpenIdeaComposer }) => {
  const steps = [
    {
      step: 'Step 01',
      title: 'Target Customer Profiling',
      detail: 'Define strict audience criteria: role, industry, daily habits, current tool stack, or key pain points.',
    },
    {
      step: 'Step 02',
      title: 'Mom-Test Question Design',
      detail: 'Formulate calibrated non-leading questions focusing on actual friction, time lost, and existing workarounds.',
    },
    {
      step: 'Step 03',
      title: 'Target Customer Deployment',
      detail: 'Deploy structured discovery to verified target profiles across consumer, professional, or B2B niches.',
    },
    {
      step: 'Step 04',
      title: 'The Final Decision',
      detail: 'Deliver clear GO/STOP decisions with real feedback, confidence scores, and roadmap recommendations.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#0a0f1d] text-[#ffffff] border-b border-[#1e293b]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8 sm:space-y-10">
        {/* Section Style Label */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#38bdf8]">
            04 / How It Works
          </span>
          <span className="text-xs font-mono text-[#94a3b8]">4-Step Protocol</span>
        </div>

        {/* ONE MAIN POSTER MESSAGE */}
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Your real target customers <br />
            <span className="text-[#38bdf8]">understand the pain.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            We write unbiased Mom-Test questions, reach verified target customers, and deliver actionable proof in 48 hours.
          </p>
        </div>

        {/* POSTER 4-STEP TIMELINE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-[#38bdf8] bg-[#0284c7]/20 px-2 py-0.5 rounded">
                  {s.step}
                </span>
                <h3 className="text-sm font-bold text-white pt-1">{s.title}</h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-xs text-[#94a3b8]">
            <UserCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <span>Target respondents are screened to eliminate polite bias and give you honest clarity.</span>
          </div>
          <button
            onClick={onOpenIdeaComposer}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a0f1d] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span>Start 48-Hour Validation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
