"use client";

import * as React from "react";
import { CheckCircleIcon, LockKeyIcon, PencilSimpleIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import { Logo } from "@/components/brand/Logo";
import type { FounderWorkspace } from "@/lib/data/journey";

export function FounderWorkspace({ token, workspace }: { token: string; workspace: FounderWorkspace }) {
  const [questions, setQuestions] = React.useState(workspace.questions);
  const [intro, setIntro] = React.useState(workspace.intro);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(true);
  const [accepted, setAccepted] = React.useState(false);

  async function save(nextQuestions = questions, nextIntro = intro) {
    if (workspace.permission !== "edit") return;
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch(`/api/w/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: nextQuestions, intro: nextIntro }),
      });
      if (!response.ok) throw new Error("Save failed");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, text: string) {
    const next = questions.map((question, questionIndex) => questionIndex === index ? { ...question, text } : question);
    setQuestions(next);
    window.clearTimeout((updateQuestion as typeof updateQuestion & { timer?: number }).timer);
    (updateQuestion as typeof updateQuestion & { timer?: number }).timer = window.setTimeout(() => void save(next), 500);
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-5">
          <Logo />
          <Badge tone={workspace.permission === "edit" ? "brand" : "neutral"}>
            {workspace.permission === "edit" ? "Founder editor" : "Read-only review"}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-5 py-8 pb-20">
        <div className="flex flex-col gap-5 border-b border-line pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="type-caption uppercase text-brand">Validation workspace</p>
            <h1 className="type-display-l mt-2 text-primary">{workspace.title}</h1>
            <p className="type-body-l mt-2 max-w-[65ch] text-secondary">{workspace.summary || "BRAINS has prepared the first validation pass for your product."}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="primary" onClick={() => { setAccepted(true); document.getElementById("activate")?.scrollIntoView({ behavior: "smooth" }); }} iconRight={<ArrowRightIcon size={17} aria-hidden="true" />}>
              Accept questions & proceed
            </Button>
            <a href={workspace.questionnaireToken ? `/q/${workspace.questionnaireToken}` : "#questions"} className="type-body-m inline-flex items-center px-3 py-2 text-secondary hover:text-primary">
              Do validation yourself
            </a>
          </div>
        </div>

        <section className="mt-7" aria-label="Research progress">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="danger" dot>Action required: review questions</Badge>
            <span className="type-caption text-tertiary">{workspace.status}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-3">
            <Stat label="Sources read" value={String(workspace.sourcesRead)} />
            <Stat label="Rounds run" value={String(workspace.roundsRun)} />
            <Stat label="Questions ready" value={String(questions.length)} />
          </dl>
        </section>

        <section id="questions" className="mt-10" aria-labelledby="questions-heading">
          <div className="flex items-end justify-between gap-4">
            <div><p className="type-caption uppercase text-brand">Your customer panel</p><h2 id="questions-heading" className="type-display-m mt-2 text-primary">Review the questions</h2></div>
            <span className="type-caption text-tertiary">{saving ? "Saving..." : saved ? "Saved" : "Unsaved"}</span>
          </div>
          <p className="type-body-m mt-2 max-w-[65ch] text-secondary">These questions were generated from the research already done on your product. Edit them so they sound like you.</p>
          <Card className="mt-5 p-5 sm:p-6">
            <label htmlFor="founder-intro" className="type-body-m font-medium text-primary">Panel introduction</label>
            <Textarea id="founder-intro" className="mt-2" value={intro} readOnly={workspace.permission !== "edit"} onChange={(event) => { setIntro(event.target.value); void save(questions, event.target.value); }} />
            <div className="mt-5 space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-2"><span className="type-caption text-tertiary">Question {index + 1}</span>{workspace.permission === "edit" ? <PencilSimpleIcon size={14} className="text-brand" aria-hidden="true" /> : <LockKeyIcon size={14} className="text-tertiary" aria-hidden="true" />}</div>
                  <Textarea className="mt-2" value={question.text} readOnly={workspace.permission !== "edit"} onChange={(event) => updateQuestion(index, event.target.value)} />
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="activate" className="mt-10" aria-labelledby="activate-heading">
          <Card elevation="raised" className="border-brand/40 bg-brand-subtle p-6 sm:p-8">
            <div className="flex items-start gap-3"><CheckCircleIcon size={22} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /><div><p className="type-caption uppercase text-brand">{accepted ? "Questions accepted" : "Next step"}</p><h2 id="activate-heading" className="type-display-m mt-2 text-primary">Activate your validation sprint</h2><p className="type-body-l mt-2 max-w-[60ch] text-secondary">BRAINS will recruit the right people, run this question set, and bring the recurring signals back into this workspace.</p><Button className="mt-5" variant="primary" iconRight={<ArrowRightIcon size={17} aria-hidden="true" />}>Choose sprint size</Button></div></div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="bg-raised p-4"><dt className="type-caption text-tertiary">{label}</dt><dd className="type-data-l mt-1 text-primary">{value}</dd></div>;
}