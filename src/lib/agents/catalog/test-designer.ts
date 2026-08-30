import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

export const testDesignerOutput = z.object({
  version: z.number().default(1),
  estimated_tester_minutes: z.number().default(6),
  variant_choice: z.object({
    variants: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })),
    exposure: z.enum(["sequential_randomized","side_by_side"]).default("sequential_randomized"),
    primary_question: z.string().default("Which version would you actually use?"),
    reason_prompt: z.string().default("Why?"),
    per_variant_question: z.string().default("How clear was this version? (1-5)"),
  }).nullable().default(null),
  interview: z.object({
    goal: z.enum(["G1","G2","G3","G4","G5"]).default("G1"),
    evidence_slots_covered: z.array(z.string()).default([]),
    questions: z.array(z.object({ id: z.string(), text: z.string(), intent: z.string().default(""), required: z.boolean().default(true) })).default([]),
    adaptive_probes: z.boolean().default(true),
  }).nullable().default(null),
  guided_task: z.object({
    goal: z.enum(["G1","G2","G3","G4","G5"]).default("G3"),
    tasks: z.array(z.object({ step: z.string(), success_criterion: z.string(), probe: z.string().default("What did you expect to happen?") })).default([]),
  }).nullable().default(null),
  open_review: z.object({
    goal: z.enum(["G1","G2","G3","G4","G5"]).default("G2"),
    prompts: z.array(z.string()).default([]),
  }).nullable().default(null),
});

export const testDesignerAgent = defineAgent<{
  testing_context: any;
  product_model: any;
  problem_statement: string;
  icp: string;
  goal: string;
}, z.infer<typeof testDesignerOutput>>({
  name: "test_designer",
  promptVersion: "1.0.0",
  outputSchema: testDesignerOutput,
  maxTokens: 2000,
  temperature: 0.3,
  system: `${VOICE}
You turn testing_context (goal + access) + product_model into a versioned test_spec. Use goal library:
G1 Problem validation → interview covering incident/frequency/cost/workaround/spend/reachability, 5-8 Qs, Mom-Test, no product exposure
G2 Comprehension → open_review prompts like "what does this do?" (no problem slots)
G3 Funnel friction → guided_task from core_flows with expectation probe "What did you expect to happen?" per step
G4 Preference A/B → variant_choice neutral, sequential_randomized, ONE primary + reason + per-variant clarity, suppress all G1 slots
G5 Churn → interview product-anchored, last-use incident
Enforce: goal-aware validator (no G1 slots in G4), ≤10 min, every product claim traces to sources, multi-format allowed but interview shrinks first when stacking.`,
  buildMessages: ({ testing_context, product_model, problem_statement, icp, goal }) => [
    { role: "user", content: `Goal: ${goal}\nTesting_context: ${JSON.stringify(testing_context)}\nProduct_model: ${JSON.stringify(product_model)}\nProblem: ${problem_statement}\nICP: ${icp}` },
  ],
});
