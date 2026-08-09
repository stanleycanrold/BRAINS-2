import type { ContentPage } from "../types";

/**
 * Service businesses, the one track where validation and selling are the
 * same activity, because there is nothing to build first.
 *
 * That changes the evidence bar rather than lowering it: when you can take
 * money this week, anything short of money is a weaker answer here than it
 * would be for a product that does not exist yet.
 */
export const page: ContentPage = {
  slug: "b2b-service-startup-idea",
  track: "business-type",
  updated: "2026-08-08",
  title: "How to validate a B2B service business before you commit to it",
  shortTitle: "Service businesses",
  summary:
    "You can sell it this week, so selling is the test. The unknown is the rate, not the demand.",
  metaTitle: "How to validate a B2B service or agency idea before you commit",
  metaDescription:
    "A service needs no build, so trying to sell it is the validation. How to test rate, repeatability and whether you have a business or a job.",
  tags: ["services", "b2b", "pricing", "interviews", "evidence"],

  answer: {
    text: "A service business is validated by trying to sell it, because there is nothing to build first. Demand is rarely the unknown. The rate is. Quote a real price to a real prospect and see what happens, since twenty warm conversations and no signed work is a clearer answer than any survey could give you.",
    stat: { value: "1", label: "paid engagement beats twenty warm calls" },
    qualifier:
      "This covers consulting, agency and done-for-you work sold to businesses. If you intend to productise it into software later, validate the service first: the service is the cheapest possible version of that product.",
  },

  tool: {
    heading: "Describe the service",
    body: "Say what you would do for whom, and roughly what you would charge. We will research who else offers it, write questions that test rate rather than interest, and score what comes back.",
    facet: { label: "Service businesses" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you commit",
      lead: [
        "The advantage of a service is that most of these can be answered within a fortnight, for the cost of your own time. The risk is mistaking a warm reception for a business.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Whether anyone will pay your rate, not a rate",
              body: "Almost everyone agrees that the work sounds valuable. The question is whether it clears the specific number you need to make this worth doing. Name a real figure early in the conversation and watch what happens, because a quote is the cheapest experiment available to you and the one most founders postpone for months.",
              badge: { text: "Do this first", tone: "success" },
            },
            {
              title: "Whether demand generalises past your own network",
              body: "The first two clients usually arrive through someone who already trusts you, and they are validating you rather than the offer. That is a real asset and a misleading signal. Try to sell the same thing to a stranger who has never heard your name, because that conversation is the one that predicts the third year.",
            },
            {
              title: "Whether it is a business or a job",
              body: "If revenue is bounded by your hours, growth means working more or charging more, and there is a ceiling on both. Work out what the business looks like at full capacity before you start. Deciding you want a well paid job is a perfectly good outcome, but it should be a decision rather than something discovered at year two.",
            },
            {
              title: "Whether the work repeats",
              body: "One-off projects mean you are selling continuously and starting from zero each January. Retained or recurring work compounds. Ask prospects whether this is a problem they have once or a problem they have every quarter, because the answer changes what the business is worth far more than the rate does.",
            },
            {
              title: "Whether you can describe it in one sentence",
              body: "Services fail commercially when nobody can refer you, and nobody can refer a generalist. If the offer takes a paragraph to explain, prospects cannot repeat it to the colleague who actually has the budget. Narrow it until a stranger could pass it on accurately, then check that the narrower version still has buyers.",
            },
          ],
        },
      ],
    },

    {
      id: "evidence",
      title: "The evidence ladder for a service",
      lead: [
        "Because you can take money almost immediately, the rungs here are steeper than for a product. Politeness is abundant and cheap in service conversations, so treat anything above a deposit with suspicion.",
      ],
      blocks: [
        {
          kind: "table",
          columns: ["What happened", "What it proves", "Weight"],
          rows: [
            [
              "They said it sounds useful",
              "Nothing. This is the cost of ending a conversation politely.",
              "None",
            ],
            [
              "They described the problem unprompted",
              "The problem is real and top of mind for them.",
              "Some",
            ],
            [
              "They told you what they pay someone else now",
              "A budget exists and a market rate is established.",
              "Good",
            ],
            [
              "They asked for a proposal with a date",
              "You reached a buyer and cleared their internal bar for interest.",
              "Strong",
            ],
            [
              "They paid a deposit",
              "The rate is real and the intent survived contact with an invoice.",
              "Decisive",
            ],
          ],
        },
        {
          kind: "callout",
          text: "A service is the one idea you can validate by trying to sell it this week, which is why an unsold service after twenty conversations is an answer rather than an early stage.",
        },
      ],
    },

    {
      id: "faq",
      title: "Questions founders ask next",
      blocks: [
        {
          kind: "faq",
          items: [
            {
              question: "How do I price a service I have never sold?",
              answer:
                "Start from what the outcome is worth to the buyer or what they currently pay someone to do it, not from your hourly cost. Ask prospects what they have paid for comparable work, which is a question about the past and therefore answerable. Then quote at the top of that range, because it is far easier to come down than to raise a rate with an existing client.",
            },
            {
              question: "Do I need a website or a company before I start selling?",
              answer:
                "No, and building one first is usually procrastination with a deliverable attached. You need a clear description of the offer, a price, and someone to say it to. Register the company when there is money to receive. Founders who spend six weeks on a brand before a single sales conversation are avoiding the test, not preparing for it.",
            },
            {
              question: "How do I know if I should productise the service into software?",
              answer:
                "Wait until you have delivered the same engagement enough times that you can see which parts are identical for every client. Those parts are the software. If every engagement is still bespoke, you have not found the repeatable core yet, and building a tool now would encode one client's process as if it were the general case.",
            },
            {
              question: "How many prospects should I speak to before deciding?",
              answer:
                "Fewer than for a product, because the signal is stronger. Twenty real sales conversations with no engagement sold is a decisive result, and you can usually get there in a month. Ten conversations with two deposits is also decisive, in the other direction. The number matters much less here because the outcome is binary and arrives fast.",
            },
            {
              question: "My first client came from a friend. Does that count?",
              answer:
                "It counts as revenue and not as validation. A friend is buying from you partly on trust that a stranger will not extend. Keep the client, and treat the next sale to someone outside your network as the real first data point. Founders who skip that step often discover in year two that the offer never worked without the introduction.",
            },
            {
              question: "Should I niche down before validating or after?",
              answer:
                "Before, and further than feels comfortable. A specific offer to a specific industry is easier to sell, easier to refer, and easier to price, and it makes the validation itself faster because you know exactly who to call. You can broaden later from a position of having something that works, which is much easier than narrowing from something nobody remembers.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Sharpen it before you sell it",
    body: "Describe the service and who it is for. Research and the full scored report cost nothing.",
  },
};
