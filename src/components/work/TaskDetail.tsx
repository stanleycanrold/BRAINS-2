"use client";
import React from "react";

type Task = {
  id: string;
  format: "interview"|"open_review"|"guided_task"|"variant_choice";
  goal: string;
  spec_version: number;
  status: string;
  qa?: any;
};

export function TaskDetail({ task, access, ab_test }: { task: Task; access?: any; ab_test?: any }) {
  if (task.format === "interview") {
    return (
      <div className="space-y-3 p-4 bg-white rounded-xl border">
        <h4 className="text-xs font-bold">Interview — {task.goal}</h4>
        <p className="text-xs text-slate-500">No product link needed. Use the script, record transcript, no product exposure.</p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">Script: ask about last incident, frequency, cost, workaround</div>
        <div className="flex gap-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100">QA: reads naturally</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100">≤10 min</span></div>
      </div>
    );
  }
  if (task.format === "variant_choice") {
    return (
      <div className="space-y-3 p-4 bg-white rounded-xl border">
        <h4 className="text-xs font-bold">A/B Choice — {task.goal}</h4>
        <div className="grid grid-cols-2 gap-3">
          {(ab_test?.variants || [{id:"A",label:"Version A",url:access?.urls?.variant_a_url},{id:"B",label:"Version B",url:access?.urls?.variant_b_url}]).map((v:any)=>(
            <div key={v.id} className="p-3 bg-slate-50 border rounded-xl">
              <div className="text-xs font-bold">{v.label} — {v.id}</div>
              <a href={v.url} target="_blank" className="text-xs text-indigo-600 underline break-all">{v.url || "no url"}</a>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Exposure: sequential_randomized — order differs per tester, choice + reason logged, neutral labels.</p>
        <div className="flex gap-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50">Both load</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50">No ID leak</span></div>
      </div>
    );
  }
  if (task.format === "guided_task") {
    return (
      <div className="space-y-3 p-4 bg-white rounded-xl border">
        <h4 className="text-xs font-bold">Guided Task — {task.goal}</h4>
        <p className="text-xs text-slate-500">URL: {access?.urls?.web_url || access?.urls?.prototype_url || "—"} + tasks with probes</p>
        <div className="space-y-2">
          {(ab_test?.tasks || [{step:"Try to complete onboarding", probe:"What did you expect to happen?"}]).map((t:any,i:number)=>(
            <div key={i} className="p-2 bg-slate-50 rounded-lg text-xs"><b>Step {i+1}:</b> {t.step} <br/><i className="text-slate-500">Probe: {t.probe}</i></div>
          ))}
        </div>
      </div>
    );
  }
  if (task.format === "open_review") {
    return (
      <div className="space-y-3 p-4 bg-white rounded-xl border">
        <h4 className="text-xs font-bold">Open Review — {task.goal}</h4>
        <p className="text-xs text-slate-500">URL: {access?.urls?.web_url || "—"} + creds if needed</p>
        <p className="text-xs">Prompt: “In your own words, what does this do?”</p>
      </div>
    );
  }
  // physical
  return (
    <div className="space-y-3 p-4 bg-white rounded-xl border">
      <h4 className="text-xs font-bold">Physical — {task.goal}</h4>
      <p className="text-xs">Location: {access?.physical?.location || "—"} | Ships: {String(access?.physical?.ships_to_tester)}</p>
      <p className="text-xs text-slate-500">{access?.physical?.logistics_notes || ""}</p>
    </div>
  );
}
