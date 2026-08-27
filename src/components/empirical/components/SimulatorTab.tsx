"use client";
import React, { useState } from 'react';
import { SlidersHorizontal, DollarSign, Users, TrendingUp, AlertTriangle, ShieldCheck, Sparkles, Check } from 'lucide-react';

export const SimulatorTab: React.FC = () => {
  const [monthlyPrice, setMonthlyPrice] = useState<number>(249);
  const [targetSegment, setTargetSegment] = useState<'early' | 'growth' | 'enterprise'>('growth');
  const [salesMotion, setSalesMotion] = useState<'self_serve' | 'hybrid' | 'sales_led'>('self_serve');
  const [cloudSupport, setCloudSupport] = useState<string[]>(['AWS', 'GitHub']);

  // Calculated simulation models based on the 142 responses dataset:
  // Optimal sweetspot is around $249 - $349
  let conversionRate = 0;
  if (monthlyPrice < 99) {
    conversionRate = 4.2; // Too cheap, trust drop
  } else if (monthlyPrice <= 299) {
    conversionRate = 18.5 - (monthlyPrice - 149) * 0.03;
  } else if (monthlyPrice <= 499) {
    conversionRate = 14.0 - (monthlyPrice - 299) * 0.025;
  } else {
    conversionRate = Math.max(2.5, 9.0 - (monthlyPrice - 499) * 0.015);
  }

  if (salesMotion === 'self_serve') conversionRate += 2.5;
  if (salesMotion === 'sales_led' && monthlyPrice < 500) conversionRate -= 4.0; // Sales calls repel devs at low price

  const projectedCustomersPer100Leads = Math.max(1, Math.round(conversionRate));
  const estimatedMonthlyRevenuePer100Leads = projectedCustomersPer100Leads * monthlyPrice;
  const churnRiskScore = monthlyPrice > 450 ? 'Medium-High' : monthlyPrice < 150 ? 'High (Low Commitment)' : 'Low (Optimal)';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Pricing & Viability Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Illustrative elasticity model. When money anchors exist, this is grounded in competitor prices + respondent spend — otherwise shows plausible range, not a quote.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Simulation Parameters
          </h3>

          {/* Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500">Target Monthly Subscription</label>
              <span className="text-lg font-black text-indigo-600">${monthlyPrice} / mo</span>
            </div>
            <input
              type="range"
              min="49"
              max="999"
              step="10"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>$49/mo (Micro)</span>
              <span>$249/mo (Sweet Spot)</span>
              <span>$999/mo (High Tier)</span>
            </div>
          </div>

          {/* Target Startup Stage */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Target Startup Stage</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'early', label: 'Pre-Seed & Seed', desc: '1-15 devs' },
                { id: 'growth', label: 'Series A', desc: '15-60 devs' },
                { id: 'enterprise', label: 'Series B+', desc: '60-200 devs' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setTargetSegment(item.id as 'early' | 'growth' | 'enterprise')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    targetSegment === item.id
                      ? 'border-indigo-600 bg-indigo-600-subtle/50 text-indigo-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sales Motion */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Sales Motion</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'self_serve', label: '100% Self-Serve', desc: 'Credit card swipe' },
                { id: 'hybrid', label: 'Product-Led Hybrid', desc: 'Self-serve + Assisted' },
                { id: 'sales_led', label: 'Sales-Led', desc: 'Demo call required' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSalesMotion(item.id as 'self_serve' | 'hybrid' | 'sales_led')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    salesMotion === item.id
                      ? 'border-indigo-600 bg-indigo-600-subtle/50 text-indigo-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outcome Forecast */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 uppercase">
                  Yield forecast
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Projected unit economics
                </h3>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-caution-subtle text-caution border border-caution/20">
                Illustrative
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">Est. conversion</span>
                <p className="text-2xl sm:text-3xl font-black font-medium text-success mt-1">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ~{projectedCustomersPer100Leads} / 100 leads
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-400">MRR / 100 leads</span>
                <p className="text-2xl sm:text-3xl font-black font-medium text-slate-900 mt-1">
                  ${estimatedMonthlyRevenuePer100Leads.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ${(estimatedMonthlyRevenuePer100Leads * 12).toLocaleString()} ARR
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                <span className="text-slate-500">Churn vulnerability:</span>
                <span
                  className={`font-medium ${
                    churnRiskScore.includes('Low') ? 'text-success' : 'text-caution'
                  }`}
                >
                  {churnRiskScore}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Recommendation:
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {monthlyPrice > 399
                    ? 'Above $399 narrows Seed conversion. Consider a $249 starter tier to keep velocity.'
                    : monthlyPrice < 199
                    ? 'Below $199 reads as low trust. $249 lifts perceived value without hurting volume.'
                    : 'This band is velocity + trust balanced before stronger pricing intel arrives.'}
                </p>
                <p className="text-[11px] text-slate-400 pt-1">Replace with Van Westendorp range when money anchors arrive — this slider is for exploration only.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
