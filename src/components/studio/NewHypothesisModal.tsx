'use client';

import React, { useState } from 'react';
import { X, Target, Plus, Sparkles } from 'lucide-react';
import { Hypothesis } from '@/lib/domain/empirical-types';

interface NewHypothesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHypothesis: (hypothesis: Hypothesis) => void;
  onShowToast: (title: string, desc?: string) => void;
}

export const NewHypothesisModal: React.FC<NewHypothesisModalProps> = ({
  isOpen,
  onClose,
  onAddHypothesis,
  onShowToast,
}) => {
  const [statement, setStatement] = useState('');
  const [category, setCategory] = useState<'Problem' | 'Pricing' | 'Go-To-Market' | 'Tech Feasibility'>('Problem');
  const [testMethod, setTestMethod] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    const newHyp: Hypothesis = {
      id: `hyp-${Date.now()}`,
      statement: statement.trim(),
      category,
      status: 'Testing',
      confidenceScore: 50,
      supportingEvidenceCount: 0,
      counterEvidenceCount: 0,
      testMethod: testMethod.trim() || 'Targeted Fast Track discovery questions',
      takeaway: 'Under active validation across the respondent pool.',
    };

    onAddHypothesis(newHyp);
    onShowToast('New hypothesis queued!', `Testing "${statement.slice(0, 40)}..."`);
    setStatement('');
    setTestMethod('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add Validation Hypothesis</h3>
              <p className="text-xs text-slate-500">Test an unvalidated business or pricing assumption against the dataset.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Problem', 'Pricing', 'Go-To-Market', 'Tech Feasibility'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                    category === cat
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Hypothesis Statement
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Early-stage founders refuse to grant AWS admin IAM read roles without a dedicated SOC-2 compliant escrow proxy."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Testing Methodology (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Unprompted security objection question during 30 discovery interviews"
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Hypothesis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
