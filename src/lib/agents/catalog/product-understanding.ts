import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

export const productUnderstandingOutput = z.object({
  what_it_does: z.string(),
  core_flows: z.array(z.string()).default([]),
  key_screens: z.array(z.string()).default([]),
  stated_icp: z.string().default(""),
  candidate_test_surfaces: z.array(z.string()).default([]),
  variant_candidates: z.array(z.string()).default([]),
  confidence: z.enum(["high","medium","low"]).default("low"),
  sources: z.array(z.object({ url: z.string(), fetched_at: z.string() })).default([]),
});

export const productUnderstandingAgent = defineAgent<{
  url: string;
  pageText: string;
  variantUrls?: string[];
}, z.infer<typeof productUnderstandingOutput>>({
  name: "product_understanding",
  promptVersion: "1.0.0",
  outputSchema: productUnderstandingOutput,
  maxTokens: 1200,
  temperature: 0.2,
  system: `${VOICE}
You read a product page the founder pasted. Extract what it does, core flows (2-5), key screens, stated ICP, candidate test surfaces, variant candidates if A/B. Confidence high if multiple pages, medium if single page with clear flows, low if landing-only. Never invent market size/demand. Read-only, never sign up. Output editable before use.`,
  buildMessages: ({ url, pageText, variantUrls }) => [
    { role: "user", content: `URL: ${url}\nPage text (8k):\n${pageText.slice(0,8000)}\n${variantUrls?.length?`Variants:\n${variantUrls.join("\n")}`:""}` },
  ],
});
