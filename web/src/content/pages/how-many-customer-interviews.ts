import type { ContentPage } from "../types";

/**
 * The number-shaped question, and the proof the template survives one.
 *
 * The counts table is the most useful thing on the page for a reader and it
 * is also the facet map for everything built on top of this question later:
 * each row is a page that can exist once there is enough first-party data to
 * say something specific about it. Rows are not niches invented to fill a
 * grid, they are the cases where the answer genuinely changes.
 */
export const page: ContentPage = {
  slug: "how-many-customer-interviews",
  track: "question",
  updated: "2026-08-04",
  title: "How many customer interviews do you need?",
  shortTitle: "How many customer interviews",
  summary:
    "Ten to fifteen for most products. Stop when three conversations in a row tell you nothing new.",
  metaTitle: "How many customer interviews do you need? (10 to 15, and why)",
  metaDescription:
    "Ten to fifteen for most products, but the count is the wrong question. The stopping rule, how the number changes by market, and what does not count as an interview.",
  tags: ["interviews", "evidence", "process"],

  answer: {
    text: "Ten to fifteen for most products, and you can start reading results at five. The count matters less than the stopping rule: stop when three conversations in a row tell you nothing you have not already heard. If the twelfth still surprises you, you are not finished.",
    stat: { value: "10-15", label: "conversations" },
    qualifier:
      "If your market splits into two clearly different kinds of buyer, that is two samples rather than one, and each needs its own count.",
  },

  tool: {
    heading: "Get the questions worth asking",
    body: "Describe what you are building and we will research it, write interview questions specific to it, and give you a link to share that needs no signup to answer.",
    starters: [
      {
        label: "I have done a few already",
        seed: "I have spoken to [number] people about [problem]. What I keep hearing is [pattern], and what I am still unsure about is ",
      },
      {
        label: "I do not know who to talk to",
        seed: "I am building [what]. I think the problem belongs to [who], but I cannot tell which of them feels it worst. What they do today is ",
      },
      {
        label: "The answers contradict each other",
        seed: "Some people tell me [one thing] and others tell me [the opposite]. The difference between the two groups might be ",
      },
    ],
  },

  sections: [
    {
      id: "by-market",
      title: "How the number changes",
      lead: [
        "The count moves with how much your buyers resemble each other. Few buyers who all work the same way need fewer conversations. Many buyers with varied lives need more, because the first several are spent learning how they differ rather than what they share.",
      ],
      blocks: [
        {
          kind: "table",
          columns: ["Situation", "Interviews", "Why"],
          rows: [
            [
              "B2B, enterprise buyer",
              "8 to 10",
              "Few buyers exist, each conversation is long, and the buying committee repeats across companies.",
            ],
            [
              "B2B, small business",
              "12 to 15",
              "Owners vary far more than enterprise buyers, so patterns take longer to separate from personality.",
            ],
            [
              "Consumer, paid",
              "20 to 30",
              "Consumer behaviour is noisier and stated intent is furthest from real behaviour when the price is small.",
            ],
            [
              "Marketplace",
              "10 per side",
              "Two populations, two confirmation rates, never averaged into one comfortable number.",
            ],
            [
              "New feature, existing product",
              "6 to 8",
              "You already have the relationship and the context. You are testing one assumption, not the whole business.",
            ],
            [
              "Regulated market",
              "12 to 15, plus a practitioner",
              "The binding constraint is often a rule rather than a preference, and one specialist answers what fifty users cannot.",
            ],
          ],
        },
      ],
    },

    {
      id: "stopping-rule",
      title: "The stopping rule beats the number",
      lead: [
        "Qualitative researchers have a word for the point where new interviews stop producing new information: saturation. It is the only honest finish line, because it is a property of what you are hearing rather than a target you set before you knew anything.",
        "In practice it arrives between conversation eight and conversation fifteen for most products, which is where the usual advice comes from. Treating that range as the rule rather than the symptom is what causes founders to stop early on a market they had not understood yet.",
      ],
      blocks: [
        {
          kind: "callout",
          text: "Stop counting conversations and start counting surprises. The number you need is however many it takes to stop being surprised.",
        },
      ],
    },

    {
      id: "what-counts",
      title: "What counts as one interview",
      lead: [
        "Most founders who say they have done twenty have done about seven. The rest were conversations about the idea with people who do not have the problem, and those move the count without moving the evidence.",
      ],
      blocks: [
        {
          kind: "compare",
          positive: {
            heading: "Counts",
            items: [
              "Someone who has the problem now, or had it within the last three months",
              "A conversation about what they actually did, not what they would do",
              "Twenty minutes or more, where they talked more than you did",
              "Notes written the same day, while you still remember the hesitations",
            ],
          },
          negative: {
            heading: "Does not count",
            items: [
              "Another founder giving you feedback on the idea",
              "A friend or family member being supportive",
              "A survey response, which is a data point but not an interview",
              "Any conversation where you described the product in the first five minutes",
            ],
          },
        },
      ],
    },

    {
      id: "mistakes",
      title: "Four ways the count misleads",
      blocks: [
        {
          kind: "cards",
          items: [
            {
              title: "Counting to the target instead of to saturation",
              body: "Ten is a planning figure, not a finish line. If conversation ten still contains something you have never heard, the sample is telling you the population is more varied than you assumed, and stopping there means shipping on a guess.",
            },
            {
              title: "Stopping the moment the answers turn positive",
              body: "The temptation peaks around interview six, when a run of encouraging conversations arrives and further asking starts to feel like risk. That instinct is the single most reliable sign you should keep going.",
            },
            {
              title: "Mixing two segments into one count",
              body: "Fifteen conversations spread across two different kinds of buyer is not fifteen, it is two samples of seven and eight, and neither is large enough to say anything. Split them the moment you notice the seam.",
            },
            {
              title: "Treating the number as the deliverable",
              body: "Fifteen conversations that all reached rung two of the evidence ladder are worth less than four that reached rung five. Quantity is a way to find signal, not a substitute for it.",
            },
          ],
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
              question: "Is five customer interviews enough to make a decision?",
              answer:
                "Enough to change direction, not enough to commit. Five conversations reliably surface whether you are talking to the wrong people or asking the wrong question, which is why the first five are the highest-value ones you will do. Five is too few to conclude that a problem is worth building on.",
            },
            {
              question: "What if everyone says the same thing after six conversations?",
              answer:
                "Check that you are not asking a leading question before you celebrate. Genuine saturation looks like different people describing the same situation in their own words and their own order. Identical phrasing across six people usually means they are echoing your framing back to you.",
            },
            {
              question: "Do surveys count toward the number?",
              answer:
                "No. A survey measures how many people select an option you wrote for them. An interview is where you find out what you failed to put on the list. Run surveys after interviews to size something you already understand, never before them to discover it.",
            },
            {
              question: "How many interviews for a marketplace or two-sided product?",
              answer:
                "Around ten per side, tracked as two separate numbers. A marketplace where eighty percent of buyers confirm and twenty percent of sellers do is not a fifty percent idea, it is a supply problem wearing an average as a disguise.",
            },
            {
              question: "How do I find enough people to interview?",
              answer:
                "Go where the problem already gets discussed rather than where your network already is. Trade forums, niche communities, industry groups, and the comment sections under complaints about the current tools. A specific, honest request to hear about their experience converts far better than an invitation to see a product.",
            },
            {
              question: "How long should each interview be?",
              answer:
                "Twenty to thirty minutes is usually right, and the ratio matters more than the length. If you are talking for more than a third of it, you are running a demo rather than an interview, and the transcript will confirm your idea no matter what the truth is.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Have the conversations run for you",
    body: "Gather the answers yourself with questions we write, or hand it over and have the interviews sourced and run. Both routes produce the same report.",
  },
};
