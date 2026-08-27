'use client';

import React, { useState } from 'react';
import { X, FileText, Download, Check, Database, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc?: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (format: string, filename: string) => {
    setDownloading(format);
    setTimeout(() => {
      setDownloading(null);
      onShowToast(`Exported ${format.toUpperCase()} successfully!`, `Saved to local files as ${filename}`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Export Validation Report & Raw Data</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download clean evidence packs for your pitch deck, board meetings, or internal PRDs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {/* Executive Memo PDF */}
          <div className="p-4 border border-slate-200 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-50/20 transition-all flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Executive Validation Memo (PDF)</h4>
                <p className="text-xs text-slate-500">
                  Comprehensive 12-page executive brief with radar charts, verdict summary, and verbatim founder quotes.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('pdf', 'NexaBrains-Executive-Validation-Report.pdf')}
              disabled={downloading === 'pdf'}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {downloading === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading === 'pdf' ? 'Generating...' : 'Export PDF'}
            </button>
          </div>

          {/* Raw JSON Dataset */}
          <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Full Raw Evidence Dataset (JSON)</h4>
                <p className="text-xs text-slate-500">
                  142 interview transcripts, structured sentiment tags, timestamps, and competitor ratings.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('json', 'nexabrains-raw-evidence-142.json')}
              disabled={downloading === 'json'}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {downloading === 'json' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading === 'json' ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>

          {/* CSV Spreadsheet */}
          <div className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-50/20 transition-all flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Respondents & Pricing Matrix (CSV)</h4>
                <p className="text-xs text-slate-500">
                  Tabular breakdown of willingness to pay, budget authority, company sizes, and pain severity.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('csv', 'nexabrains-respondents-wtp.csv')}
              disabled={downloading === 'csv'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {downloading === 'csv' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
