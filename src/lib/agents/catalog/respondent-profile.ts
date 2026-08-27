import { z } from "zod";
import { defineAgent } from "../types";
import { VOICE } from "./voice";

// Respondent Profile Extraction Agent

/**
 * Extracts a complete respondent profile from their interview transcript,
 * even when they never filled the explicit "About you" fields.
 *
 * A headteacher will say "I lead a primary school of 400 pupils" -- that is
 * not in a form field, but it tells us role, company size, industry, and
 * that they decide. A product manager will say "I run the checkout squad at
 * a 40-person fintech" -- same.
 *
 * This is the one agent that fills every insight the studio's summary needs:
 * roles, sizes, industries, tools, and purchase power. Without it the
 * summary shows "No roles recorded yet" while the transcript holds the answer.
 */

export const respondentProfileOutput = z.object({
  display_name: z.string().describe("Person's name as they wrote it in an identification answer, e.g. 'Sarah Jenkins, Headteacher'. Empty if not stated. Use their own words, not the alias."),
  role: z.string().describe("Concise role as the person describes it, e.g. 'Headteacher', 'Product Manager', 'Classroom teacher'. Empty if truly not stated."),
  company_size: z.string().describe("Size as stated or clearly implied, e.g. '400 pupils', '60 staff', '18-person team'. Empty if not inferrable."),
  industry: z.string().describe("Industry / context, e.g. 'Primary education', 'K-12', 'Fintech'. Empty if not inferrable."),
  decision_maker: z.boolean().describe("True if this person can decide or strongly influence purchase for this problem in their org."),
  decision_maker_reasoning: z.string().describe("One sentence why, e.g. 'Headteacher controls school budget' or 'IC reports to head, does not sign'."),
  current_tools: z.array(z.string()).describe("Tools/workarounds they name for this problem today, verbatim short names."),
  icp_relevant_detail: z.string().describe("One line capturing why this profile matters for the ICP, or why it is adjacent/outside."),
});

export const respondentProfileAgent = defineAgent<
  {
    problemStatement: string;
    icp: string;
    questions: { id: string; text: string; intent: string }[];
    answers: { question_id: string; question: string; answer: string }[];
    notes: string;
    explicitProfile?: {
      company_size?: string;
      industry?: string;
      decision_maker?: boolean;
      current_tools?: string[];
    };
    respondentCareerRaw?: string;
  },
  z.infer<typeof respondentProfileOutput>
>({
  name: "respondent_profile_extraction",
  promptVersion: "1.0.0",
  outputSchema: respondentProfileOutput,
  temperature: 0,
  maxTokens: 800,
  system: `${VOICE}

You extract a respondent's profile from their interview -- even when they never filled the "About you" form and never state their job title directly.

DISPLAY NAME -- the founder will see this, not Respondent 01. Look EVERYWHERE:
- Dedicated name field: if respondentName is provided, use it.
- Identification question: founder often adds "What is your name? How can we identify you? Who are you? How can we contact you?" as an open question. If any question text contains name/identify/who are you/contact, its answer IS the name. Example: Q "What is your name and role?" → A "Sarah Jenkins, Headteacher at SafeSpark Primary" → display_name "Sarah Jenkins, Headteacher".
- Soft identification: even without such a question, an answer like "My name is Aisha, I teach Year 5" or "I'm John, a product manager" contains a name — extract it.
- Keep as they wrote it, 2-4 words for the person plus optional role. Empty only if no answer looks like a name at all. Never return "Interview participant" or "Respondent".

ROLE -- the most important field. Infer from EVERY clue in the transcript:

- Direct statement: "I lead a primary school" -> Headteacher. "I run the checkout squad" -> Product Manager.
- Seniority matters: "Headteacher", "Head teacher", "Principal", "Deputy head", "Assistant head" -> Headteacher. "Classroom teacher", "Teacher", "Class teacher" -> Teacher. "Teaching assistant", "TA", "Learning support assistant" -> Teaching assistant. "IT Manager", "IT Lead", "Network manager" -> IT Manager.
- Contextual inference is REQUIRED: "My pupils were researching countries" + "our school lost internet" -> the person teaches those pupils -> Teacher. "I lead a primary school of 400 pupils" + "we had to abandon the activity" -> Headteacher (they speak for the school). "I ride 20km to work daily" -> Commuter cyclist. "I deliver food around the city" -> Food delivery rider.
- Choose the role a colleague would use to describe them. 2-4 words. A role like "Headteacher", "Teacher", "Teaching assistant", "IT Manager", "Commuter cyclist", "Product Manager".
- Only return "" when the transcript gives truly zero situational clues -- which is rare. A respondent describing a workplace or daily routine almost always implies a role.

ROLE CANONICALISATION: Normalise to the standard title:
- "Headteacher", "Head teacher", "Principal", "Head of school" -> "Headteacher"
- "Classroom teacher", "Teacher", "Class teacher" -> "Teacher"
- "Teaching assistant", "TA", "Learning support assistant" -> "Teaching assistant"
- "IT Manager", "IT Lead", "Network manager" -> "IT Manager"
- "Product Manager", "Product Lead" -> "Product Manager"
- "Founder", "Co-founder", "Owner" -> "Founder"
- "Director", "Head of [dept]", "VP", "VP of [dept]" -> "Director"
- "Manager", "Lead", "Team lead" -> "Manager"
- "Commuter cyclist", "Cyclist" -> "Commuter cyclist"
- "Food delivery rider", "Delivery rider", "Delivery driver" -> "Food delivery rider"

COMPANY SIZE & INDUSTRY: Any size or sector they mention in passing. "400 pupils", "60 staff", "K-12 school in a rural region" -> K-12 / Primary education. Empty only if nothing situational exists.

DECISION MAKER: True if this person can decide or strongly influence purchase for THIS problem in their org. A headteacher controls a school's learning-tools budget -- true even when the form says nothing. A product manager who runs the relevant squad -- true. A classroom teacher who reports to a head -- false, but note they influence tool choice. A commuter buying their own bike -- true (they are the buyer). Explain in one sentence why.

CURRENT TOOLS: Exact tool/workaround names they list for handling this problem today. "Google Classroom, printed worksheets, offline atlases" -> ["Google Classroom", "Printed worksheets", "Offline atlases"]. Empty if none mentioned.

ICP RELEVANT DETAIL: One line tying this profile to the ICP or explaining why it is adjacent/outside.

RULES:
- Only use what the transcript actually says -- but READ THE WHOLE TRANSCRIPT before concluding a role is absent. Situational clues ("my pupils", "our staff", "I deliver", "my commute", "our school", "my headteacher") are role evidence.
- Prefer the person's own words over a form field when they conflict -- the transcript is more recent and more specific.
- If the explicit profile already has a value (e.g., company_size "60 staff"), keep it unless the transcript clearly contradicts or refines it.
- Keep role to a concise title, not a sentence.
- Tools are short names, not sentences.
`,
  buildMessages: ({ problemStatement, icp, questions, answers, notes, explicitProfile, respondentCareerRaw }) => [
    {
      role: "user",
      content: [
        `Problem being validated: ${problemStatement}`,
        `ICP: ${icp}`,
        "",
        questions.length
          ? `Questions asked:\n${questions.map((q) => `- [${q.id}] ${q.text} (intent: ${q.intent})`).join("\n")}`
          : "",
        "",
        explicitProfile
          ? `Explicit profile fields (when the form was filled):\n${JSON.stringify(explicitProfile, null, 2)}`
          : "Explicit profile fields: none -- infer entirely from transcript.",
        respondentCareerRaw ? `Raw role field: "${respondentCareerRaw}"` : "",
        "",
        answers.length
          ? `Transcript (Q -> A):\n${answers.map((a) => `[${a.question_id}] ${a.question}\n-> ${a.answer || "(no answer)"}`).join("\n\n")}`
          : `Notes:\n"""\n${notes || "(no notes)"}\n"""`,
        "",
        "Extract the profile. Return empty strings for anything not inferrable, not a guess.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ],
});