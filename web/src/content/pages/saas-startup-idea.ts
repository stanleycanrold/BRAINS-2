import type { ContentPage } from "../types";

/**
 * B2B SaaS, where the distinguishing failure is that the enthusiastic user
 * and the person with a budget are two different people.
 *
 * Every check here turns on that split. A page that could be retitled for
 * another business type by changing a noun has failed the bar the
 * marketplace page set.
 */
export const page: ContentPage = {
  slug: "saas-startup-idea",
  track: "business-type",
  updated: "2026-08-08",
  title: "How to validate a SaaS startup idea before you build it",
  shortTitle: "SaaS ideas",
  summary:
    "The user who loves it and the buyer who signs are different people. Only one of them is evidence.",
  metaTitle: "How to validate a SaaS startup idea before you build it",
  metaDescription:
    "B2B software fails on budget and switching cost, not features. How to reach the person who signs, and what their answer has to contain to count.",
  tags: ["saas", "b2b", "pricing", "interviews", "evidence"],

  answer: {
    text: "Validating a SaaS idea means finding the person who signs, not the person who nods. Users and budget holders answer differently, and only the budget holder's answer predicts revenue. Ask both what they bought last, what it cost, and how long approval took. Track their confirmation rates separately.",
    qualifier:
      "This applies to software sold to a company. If you are selling to an individual who pays with their own card, the buyer and the user are the same person and most of this collapses into one conversation.",
  },

  tool: {
    heading: "Describe your SaaS idea",
    body: "Say who uses it and whose budget it comes out of. We will research the problem against real sources, write the questions worth asking each of them, and score what comes back.",
    facet: { label: "SaaS ideas" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you build",
      lead: [
        "These are the checks specific to software sold into a company. A general validation checklist will surface none of them, because none of them exist when one person decides and pays on the spot.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Who signs, and whether you have spoken to them",
              body: "Founders overwhelmingly interview the person who feels the pain, because that person is easy to find and happy to talk. That person frequently cannot authorise a purchase. Find out who approves spending in this range and whether anyone in your sample holds that authority, before you read your results as demand.",
            },
            {
              title: "What they bought last, and how that purchase happened",
              body: "A company that has bought comparable software in the last year has a working path to approval. One that has not may have no path at all. Ask about the last tool their team paid for, what it cost, who signed, and how long it took, because a purchase that already happened is checkable and a purchase they imagine is not.",
            },
            {
              title: "What the work costs them today",
              body: "Your real competitor is almost always a spreadsheet plus somebody's Tuesday. That is free from a budget perspective, which is exactly why it survives. Get the hours, who does them, and what breaks when that person is away. A cost you can name in hours is the beginning of a business case they can take upstairs.",
            },
            {
              title: "What it would take to move their data",
              body: "Displacing an incumbent means someone has to migrate records, retrain a team, and own the outcome if it goes badly. That cost lands on a person, not on a company, and it is why obviously better products lose. Ask directly what a switch would involve and listen for who would have to do the work.",
            },
            {
              title: "Whether this is a line item or a nice idea",
              body: "Budget is allocated in cycles, against categories that already exist. Something that fits an existing category gets bought this quarter. Something genuinely new waits for a budget line to be created for it, which can take a year. Ask which category this would come out of, and treat not knowing as a finding.",
            },
          ],
        },
        {
          kind: "callout",
          text: "A user who loves it and a buyer who signs are two different people, and only one of their answers is evidence.",
        },
      ],
    },

    {
      id: "evidence",
      title: "What counts as evidence here",
      lead: [
        "Software gets more polite enthusiasm than almost any other category, because agreeing that a tool sounds useful costs a person nothing and ends the conversation pleasantly.",
      ],
      blocks: [
        {
          kind: "compare",
          positive: {
            heading: "Counts",
            items: [
              "A budget holder naming the category this would be paid from",
              "A specific account of the last comparable purchase, with a figure",
              "Hours per week spent on the workaround, from the person who spends them",
              "Someone describing what they tried already and why they stopped",
              "A named person who would have to own the migration",
            ],
          },
          negative: {
            heading: "Does not count",
            items: [
              "We would definitely look at that",
              "Enthusiasm from someone who cannot approve spending",
              "Interest in a feature nobody currently does by hand",
              "A price someone would pay in a year with a budget they do not have",
              "Agreement that the current process is annoying, with no cost attached",
            ],
          },
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
              question: "How do I validate a B2B SaaS idea without an existing network?",
              answer:
                "Go where the job is discussed rather than where founders are. Trade communities, professional forums, and the support channels of tools your buyers already use will get you closer than a general startup audience. Expect it to be slower than consumer recruiting, and treat the difficulty of reaching these people as a finding in itself, because it is also your future cost of acquisition.",
            },
            {
              question: "Should I talk to users or to buyers?",
              answer:
                "Both, in separate conversations, with different questions. Users tell you whether the problem is real and what the workflow actually looks like. Buyers tell you whether it gets paid for. Averaging the two into one confirmation rate hides the case that sinks most B2B software, which is a genuine problem that nobody has authority to spend money on.",
            },
            {
              question: "How do I test pricing before I have a product?",
              answer:
                "Do not ask what someone would pay. Ask what they currently pay for the nearest thing, and what the manual workaround costs in hours. Those two figures bracket a realistic range, and both refer to money that has already moved. A number someone invents for a hypothetical product tends to be either flattery or a guess.",
            },
            {
              question: "Is a signed letter of intent real validation?",
              answer:
                "It is better than enthusiasm and weaker than money. A letter of intent costs the signer nothing, which is why they are relatively easy to collect. Treat one as evidence that you reached a real buyer and that the problem cleared their internal bar for interest, not as evidence that a purchase will happen.",
            },
            {
              question: "What if my SaaS idea replaces a tool they already pay for?",
              answer:
                "Then switching cost is your main risk, not the problem itself, and you should test that specifically. Ask what would have to be true for them to move, who would do the migration, and what happens to that person if it goes wrong. Displacement is usually won on a change they are already being forced to make, so ask what is changing in their stack this year.",
            },
            {
              question: "How many companies should I talk to for a SaaS idea?",
              answer:
                "Around ten to fifteen companies, with at least a third of those conversations including someone who can approve a purchase. The count matters less than that split. Fifteen enthusiastic users and no budget holders is a smaller sample than it looks, because it has not tested the thing most likely to kill the business.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Test it before you build it",
    body: "Describe the software and who it is for. Research and the full scored report cost nothing.",
  },
};
