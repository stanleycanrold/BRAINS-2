import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

export const contextOutput = z.object({
  round_goal: z.object({ primary: z.enum(["G1","G2","G3","G4","G5"]), secondary: z.enum(["G1","G2","G3","G4","G5"]).nullable().default(null) }),
  product_stage: z.enum(["idea_only","mvp","live"]),
  testing_context: z.object({
    round_goal: z.object({ primary: z.enum(["G1","G2","G3","G4","G5"]).default("G1"), secondary: z.enum(["G1","G2","G3","G4","G5"]).nullable().default(null) }).default({ primary: "G1", secondary: null }),
    access: z.object({
      mode: z.enum(["none","web_url","app_store","testflight_apk","prototype_url","physical"]).default("none"),
      urls: z.object({
        web_url: z.string().nullable().default(null),
        app_store_url: z.string().nullable().default(null),
        play_store_url: z.string().nullable().default(null),
        testflight_or_apk_url: z.string().nullable().default(null),
        prototype_url: z.string().nullable().default(null),
        variant_a_url: z.string().nullable().default(null),
        variant_b_url: z.string().nullable().default(null),
      }).default({ web_url: null, app_store_url: null, play_store_url: null, testflight_or_apk_url: null, prototype_url: null, variant_a_url: null, variant_b_url: null }),
      physical: z.object({ required: z.boolean().default(false), location: z.string().nullable().default(null), ships_to_tester: z.boolean().nullable().default(null), logistics_notes: z.string().nullable().default(null) }).default({ required: false, location: null, ships_to_tester: null, logistics_notes: null }),
    }).default({ mode: "none", urls: { web_url: null, app_store_url: null, play_store_url: null, testflight_or_apk_url: null, prototype_url: null, variant_a_url: null, variant_b_url: null }, physical: { required: false, location: null, ships_to_tester: null, logistics_notes: null } }),
    formats: z.array(z.enum(["interview","open_review","guided_task","variant_choice"])).default(["interview"]),
    ongoing: z.boolean().default(false),
    freelancer_requirements: z.object({ needs_geographic_proximity: z.boolean().default(false), device_or_os_requirements: z.string().nullable().default(null), special_instructions: z.string().nullable().default(null) }).default({ needs_geographic_proximity: false, device_or_os_requirements: null, special_instructions: null }),
    confidence: z.enum(["high","medium","low"]).default("medium"),
    unresolved: z.array(z.string()).default([]),
  }),
  nextQuestions: z.array(z.object({ id: z.string(), text: z.string(), chips: z.array(z.string()).default([]), type: z.enum(["stage","form","goal","link","physical","ongoing"]).default("stage") })).max(2).default([]),
  isComplete: z.boolean().default(false),
  summaryDraft: z.string().default(""),
}).passthrough();

export const contextAgent = defineAgent<{
  description: string;
  targetAudience: string;
  stageHint?: string;
  formHint?: string;
  productLink?: string;
  productModelSummary?: string;
  conversationHistory: { q: string; a: string }[];
}, z.infer<typeof contextOutput>>({
  name: "context_classification",
  promptVersion: "1.0.0",
  outputSchema: contextOutput,
  maxTokens: 1500,
  temperature: 0.2,
  system: `${VOICE}

ROLE
You are the Context Agent for BRAINS AI. Take a founder's initial description and, through the smallest possible number of follow-up questions, determine: (1) enough context for Research (if needed) and (2) a confident classification of what kind of testing environment this idea will need for real testers.

CORE RULE — Ask only what you cannot already infer. Before asking, check if founder's own words already answer it. Never ask for a website/app store link when founder said "I want to develop" (idea_only). Never ask physical location unless idea is genuinely physical.

STEP 1 — READ INPUT: infer product_stage (idea_only/mvp/live), product form (web/mobile/physical/unclear), ongoing signal, round_goal (G1 idea validation, G2 comprehension, G3 funnel friction, G4 preference A/B, G5 churn). Use stageHint/formHint if given, but founder text wins.

STEP 2 — WHAT'S STILL UNKNOWN for testing_context: for likely testing_types, what fields missing? Common gaps: mvp/live but no link, form ambiguous web vs mobile, physical but no logistics, recurring signal unconfirmed.

STEP 3 — ASK 1-2 MOST INFORMATIVE unknowns. Stop when confident. Never >2 per turn.

STEP 4 — CLASSIFY testing_context per taxonomy: concept_only_interview (none, interview), link_review (web_url, open_review), app_store_install (app_store|testflight_apk, open_review/guided_task), prototype_walkthrough (prototype_url, guided_task), physical_product_testing (physical, interview/open_review), continuous_feature_testing (ongoing:true), ab_test (variant_choice requires ≥2 assets), usability_task/preference_test. Multi-format allowed. access none => formats ⊆ {interview}. location only if physical.

HARD RULES: max 4 total in code (you may be called up to 4 times, each time you may ask 1-2). If not confident by 4, best classification + unresolved flag. Ambiguity => direct chip, never silent guess.`,
  buildMessages: ({ description, targetAudience, stageHint, formHint, productLink, productModelSummary, conversationHistory }) => [
    {
      role: "user",
      content: [
        `Initial: ${description}`,
        `Who it's for: ${targetAudience}`,
        stageHint ? `Stage chip: ${stageHint}` : "",
        formHint ? `Form chip: ${formHint}` : "",
        productLink ? `Link pasted: ${productLink}` : "",
        productModelSummary ? `Product model (from link fetch): ${productModelSummary}` : "",
        conversationHistory.length ? `History:\n${conversationHistory.map(h=>`Q: ${h.q}\nA: ${h.a}`).join("\n")}` : "",
        "",
        "Classify and give nextQuestions (0-2) or isComplete=true with testing_context.",
      ].filter(Boolean).join("\n"),
    },
  ],
});
