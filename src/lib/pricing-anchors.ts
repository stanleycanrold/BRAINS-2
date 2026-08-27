/**
 * Finding money in prose.
 *
 * The pricing-intelligence agent may only anchor on real money - prices,
 * spend, budgets - never on stated intent. These helpers are the gate: they
 * pull the sentences that mention amounts so the agent works from actual
 * anchors, and an empty result means "anchor_missing" rather than a guess.
 *
 * Pure functions on strings, no server imports, so both the orchestrator and
 * the per-response enrichment can share them.
 */

/** Sentences that mention an actual amount of money — expanded for G2/Capterra/PR pricing tables. */
const MONEY_SENTENCE =
  /\$\s?\d[\d,]*(\.\d{2})?|\d[\d,]*\s?(usd|dollars?|bucks|euros?|€|£|gbp|cad|aud)\b|\d[\d,]*\s?(\/|per\s|a\s)(mo|month|yr|year|week|day|seat|user)|\$\s?\d+k?\s?(\/|per|a)?\s*(mo|month)|\b(free|freemium)\b.*\$\s?\d+|\$\d+\d*|\d+\s?k\s?(a year|per year)/i;

/** Budget-ish phrasing, for telling a stated budget apart from plain cost. */
const BUDGET_SENTENCE =
  /budget|pay up to|would consider paying|expect(ed)? to pay|price (point|range)|spend(ing)? (around|about|roughly)|we pay|currently (pay|cost)|worth paying|card today|corporate card|swipe/i;

/** Splits text into sentences the way the notes format writes them. */
function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\n{1,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

/**
 * The sentences of a text that mention money, trimmed and deduplicated.
 * Empty when the text carries no money anchor at all.
 */
export function moneySnippets(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const s of sentences(text)) {
    if (MONEY_SENTENCE.test(s) && !found.includes(s)) {
      found.push(s.slice(0, 280));
    }
  }
  return found;
}

/** Of the money sentences, the ones that read as a stated budget. */
export function budgetSnippets(text: string): string[] {
  return moneySnippets(text).filter((s) => BUDGET_SENTENCE.test(s));
}

/** True when a text carries any money anchor at all. */
export function hasMoneyAnchor(text: string): boolean {
  return moneySnippets(text).length > 0;
}
