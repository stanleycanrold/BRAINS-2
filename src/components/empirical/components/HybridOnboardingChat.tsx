"use client";
import React, { useState } from "react";
import { Send, Link2, MapPin, Repeat, ChevronRight, CheckCircle2 } from "lucide-react";

type Msg = { role: "user" | "agent"; text: string; chips?: string[]; linkCard?: { url: string; status: "scanning" | "done"; teaser?: string } };

export function HybridOnboardingChat({ onDone, onShowToast }: { onDone: (ctx: any) => void; onShowToast: any }) {
  const [input, setInput] = useState("");
  const [stageChip, setStageChip] = useState<string | null>(null);
  const [formChip, setFormChip] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [pendingQs, setPendingQs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<"scanning"|"done"|null>(null);

  const detectLink = (t: string) => t.match(/https?:\/\/\S+/)?.[0] || null;

  async function start() {
    if (!input.trim()) return;
    const url = detectLink(input);
    if (url) { setLink(url); setLinkStatus("scanning"); }
    setThread([{ role: "user", text: input }]);
    setLoading(true);
    const res = await fetch("/api/context/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: input, targetAudience: "", stageHint: stageChip, formHint: formChip, productLink: url }) });
    const data = await res.json();
    setLoading(false);
    if (url) setLinkStatus("done");
    if (data.nextQuestions?.length) {
      setPendingQs(data.nextQuestions);
      setThread(prev => [...prev, { role: "agent", text: data.nextQuestions[0].text, chips: data.nextQuestions[0].chips }]);
    } else {
      setSummary(data);
      setThread(prev => [...prev, { role: "agent", text: data.summaryDraft }]);
    }
    // keep for turn
    (globalThis as any).__ctx = data;
  }

  async function answer(chipOrText: string) {
    const q = pendingQs[0];
    if (!q) return;
    setThread(prev => [...prev, { role: "user", text: chipOrText }]);
    const newHistory = [...history, { q: q.text, a: chipOrText }];
    setHistory(newHistory);
    setPendingQs(prev => prev.slice(1));
    if (newHistory.length >= 4) { setSummary((globalThis as any).__ctx); return; }
    setLoading(true);
    const res = await fetch("/api/context/turn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: thread[0]?.text || "", targetAudience: "", stageHint: stageChip, formHint: formChip, productLink: link, conversationHistory: newHistory.slice(0, -1), lastAnswer: chipOrText, lastQuestionIds: [q.id] }) });
    const data = await res.json();
    setLoading(false);
    (globalThis as any).__ctx = data;
    if (data.nextQuestions?.length) {
      setPendingQs(data.nextQuestions);
      setThread(prev => [...prev, { role: "agent", text: data.nextQuestions[0].text, chips: data.nextQuestions[0].chips }]);
    } else {
      setSummary(data);
      setThread(prev => [...prev, { role: "agent", text: data.summaryDraft }]);
    }
  }

  if (summary) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h4 className="text-xs font-bold text-indigo-900">Summary — edit before confirm</h4>
          <p className="text-xs text-indigo-800 mt-1">{summary.summaryDraft}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {summary.testing_context?.formats?.map((f:string)=><span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-indigo-200">{f}</span>)}
            {summary.testing_context?.round_goal && <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-indigo-200">Goal: {summary.testing_context.round_goal.primary}</span>}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=> onDone(summary)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Confirm & Generate Test</button>
            <button onClick={()=> setSummary(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold">Edit</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["Idea only","MVP","Live"].map(s=><button key={s} onClick={()=> setStageChip(s)} className={`px-3 py-1.5 rounded-full border text-xs font-bold ${stageChip===s?"bg-indigo-600 text-white border-indigo-600":"bg-slate-50 border-slate-200"}`}>{s}</button>)}
        {["Mobile","Web","Physical","Other"].map(s=><button key={s} onClick={()=> setFormChip(s)} className={`px-3 py-1.5 rounded-full border text-xs font-bold ${formChip===s?"bg-indigo-600 text-white border-indigo-600":"bg-slate-50 border-slate-200"}`}>{s}</button>)}
      </div>

      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <textarea value={input} onChange={e=> setInput(e.target.value)} placeholder="I want to develop ABC... or I have built an app that does..." rows={3} className="w-full resize-none outline-none text-sm" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Paste a link and we’ll read it while you chat</span>
          <button onClick={start} disabled={loading || !input.trim()} className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Send className="w-3.5 h-3.5"/> Start</button>
        </div>
      </div>

      {link && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-medium truncate">{link}</span>
          <span className="text-[11px] text-slate-500">{linkStatus==="scanning"?"Reading your site…":"Ready"}</span>
        </div>
      )}

      <div className="space-y-3 max-h-[300px] overflow-auto">
        {thread.map((m,i)=> (
          <div key={i} className={`p-3 rounded-xl text-xs ${m.role==="user"?"bg-indigo-600 text-white ml-8":"bg-slate-50 border border-slate-200"}`}>
            {m.text}
            {m.chips && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.chips.map(c=><button key={c} onClick={()=> answer(c)} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold hover:bg-indigo-50">{c}</button>)}
                <span className="text-[11px] text-slate-400 self-center">or type it</span>
              </div>
            )}
          </div>
        ))}
        {pendingQs.length>0 && <div className="text-[11px] text-slate-400">Question {history.length+1} of up to 4</div>}
        {loading && <div className="text-xs text-slate-500">Thinking…</div>}
      </div>

      {pendingQs.length>0 && (
        <div className="flex gap-2">
          <input placeholder="Type your answer..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" onKeyDown={e=> { if(e.key==="Enter") answer((e.target as HTMLInputElement).value); }} />
          <button onClick={()=> {
            const el = document.querySelector<HTMLInputElement>('input[placeholder="Type your answer..."]');
            if(el?.value) answer(el.value);
          }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Send</button>
        </div>
      )}
    </div>
  );
}
