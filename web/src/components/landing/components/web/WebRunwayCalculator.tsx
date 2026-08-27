"use client";
import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
} from 'lucide-react';

export const WebRunwayCalculator: React.FC<{ onOpenIdeaComposer: () => void }> = ({
  onOpenIdeaComposer,
}) => {
  const [engineers, setEngineers] = useState<number>(2);
  const [salaryMonthly, setSalaryMonthly] = useState<number>(12000);
  const [devMonths, setDevMonths] = useState<number>(4);
  const [infraMonthly, setInfraMonthly] = useState<number>(1500);

  // Math
  const totalDevBurn = engineers * salaryMonthly * devMonths + infraMonthly * devMonths;
  const brainsCost = 299;
  const netRunwaySaved = totalDevBurn - brainsCost;
  const roiMultiplier = Math.round(totalDevBurn / brainsCost);

  return (
    <section className="py-16 bg-page text-primary border-b border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Runway Economics
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-primary">
            Runway burn comparison
          </h2>
          <p className="text-sm sm:text-base text-secondary max-w-2xl">
            The most expensive code in the world is an unvalidated feature nobody pays for.
          </p>
        </div>

        {/* Interactive Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10 items-stretch">
          {/* Controls */}
          <div className="lg:col-span-6 bg-raised border border-line p-5 sm:p-6 rounded-lg space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                MVP Assumptions
              </span>
              <span className="text-[11px] text-secondary font-mono">Standard Startup Burn</span>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-medium">Engineers:</span>
                  <span className="font-mono font-bold text-brand">{engineers} devs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={engineers}
                  onChange={(e) => setEngineers(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-medium">Loaded Monthly Cost / Dev:</span>
                  <span className="font-mono font-bold text-brand">
                    ${salaryMonthly.toLocaleString()}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min="6000"
                  max="22000"
                  step="1000"
                  value={salaryMonthly}
                  onChange={(e) => setSalaryMonthly(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-medium">Months to Build &amp; Launch:</span>
                  <span className="font-mono font-bold text-brand">{devMonths} months</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={devMonths}
                  onChange={(e) => setDevMonths(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-medium">Monthly Cloud Overhead:</span>
                  <span className="font-mono font-bold text-brand">
                    ${infraMonthly.toLocaleString()}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="500"
                  value={infraMonthly}
                  onChange={(e) => setInfraMonthly(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-6 bg-raised border border-line p-5 sm:p-6 rounded-lg flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Runway Impact
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success-subtle text-success border border-success/30">
                  {roiMultiplier}x Capital Efficiency
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs text-secondary">Traditional MVP Dev Burn:</span>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-danger mt-0.5">
                    ${totalDevBurn.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {engineers} engineers × {devMonths} months + cloud costs
                  </p>
                </div>

                <div className="p-3.5 rounded bg-page border border-line">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-primary">
                        BRAINS Sprint:
                      </span>
                      <p className="text-lg font-bold font-mono text-success mt-0.5">$299 flat</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-secondary">Turnaround:</span>
                      <p className="text-lg font-bold font-mono text-primary mt-0.5">48 Hours</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-primary mb-1">
                    <span>Net Runway Protected:</span>
                    <span className="font-mono font-bold text-success">
                      +${netRunwaySaved.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-line">
              <button
                onClick={onOpenIdeaComposer}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-on-accent text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Validate Before Building</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
