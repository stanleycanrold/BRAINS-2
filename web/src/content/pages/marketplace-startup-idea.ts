import type { ContentPage } from "../types";

/**
 * The business-type track's founding page, and the sample the rest of that
 * track gets built from.
 *
 * The bar it has to clear, and that every sibling has to clear too: a
 * genuinely marketplace-specific answer, checks that only apply to two-sided
 * businesses, and an FAQ whose questions could not be swapped onto another
 * niche by changing a noun. If a business type cannot clear that bar, the
 * rule is to cut the page rather than publish it thin.
 */
export const page: ContentPage = {
  slug: "marketplace-startup-idea",
  track: "business-type",
  updated: "2026-08-04",
  title: "How to validate a marketplace startup idea before you build it",
  shortTitle: "Marketplace ideas",
  summary:
    "Test the harder side first, against an empty marketplace. Two confirmation rates, never averaged.",
  metaTitle: "How to validate a marketplace startup idea before you build it",
  metaDescription:
    "Marketplaces fail on the cold-start problem, not the software. How to test whether your harder side shows up before the other exists, and what counts as evidence.",
  tags: ["marketplace", "evidence", "interviews", "cold-start"],

  answer: {
    text: "Validating a marketplace means proving your harder side will join before your easier side exists. Talk to that side first about what they do today, not what they would do with your product. Track confirmation separately per side: a marketplace where 80% of buyers confirm and 20% of sellers do is not a 50% idea.",
    stat: { value: "2", label: "rates, never averaged" },
    qualifier:
      "This applies to two-sided marketplaces specifically. A single-sided product only needs one confirmation rate, not two.",
  },

  tool: {
    heading: "Describe your marketplace",
    body: "Say who is on each side and what they are trading. We will research whether the problem is real, write the questions worth asking, and score what comes back.",
    facet: { label: "Marketplace ideas" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you build",
      lead: [
        "These are the checks specific to two-sided businesses. A general idea-validation checklist will not surface any of them, which is why so many marketplace post-mortems read the same way.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Which side is harder to get, and why",
              body: "Almost every marketplace has a hard side and an easy side, and founders routinely guess wrong about which is which. Sellers are usually harder for consumer marketplaces; buyers are usually harder in B2B. Getting this wrong means building the wrong supply first and watching it churn while you look for demand.",
            },
            {
              title: "Whether the hard side will show up for an empty marketplace",
              body: "The only honest question at this stage is whether someone will join before there is anything on the other side. Ask people on the hard side directly what would make them list, and listen specifically for whether their answer depends on volume you do not have yet.",
            },
            {
              title: "What they do instead today",
              body: "Most marketplace ideas are competing with a WhatsApp group, a spreadsheet, a Facebook group, or an existing broker, not with another marketplace. Those alternatives are free and already have the network. Find out what breaks about them before assuming a product replaces them.",
            },
            {
              title: "Whether the transaction can leave your platform",
              body: "If buyer and seller can easily meet once and transact off-platform forever after, the model leaks. Ask people whether they would keep using an intermediary after the first successful match, and take a hesitant answer seriously.",
            },
            {
              title: "How often the same buyer needs this",
              body: "A marketplace for a once-in-a-decade purchase has to re-acquire nearly every user. Frequency is the difference between a business that compounds and one that runs on paid acquisition forever, and it is knowable before you build anything.",
            },
          ],
        },
      ],
    },

    {
      id: "evidence",
      title: "What counts as evidence here",
      lead: [
        "The trap in marketplace validation is collecting enthusiasm from the easy side and reading it as a signal for the whole business.",
      ],
      blocks: [
        {
          kind: "checklist",
          items: [
            "Two confirmation rates, tracked separately, never averaged",
            "At least one person on the hard side describing the problem unprompted",
            "A specific account of what they use today and what breaks about it",
            "Someone who already pays for a worse version of the match",
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
              question: "How do I validate a marketplace when neither side exists yet?",
              answer:
                "Validate one side at a time, starting with the harder one. Talk to people on the hard side about what they do today and what would make them list, without asking them to imagine a product. If the hard side will not commit to an empty marketplace, that is the finding, and it is far cheaper to learn it now than after you have built matching and payments.",
            },
            {
              question: "How many people should I talk to for a marketplace idea?",
              answer:
                "More than for a single-sided product, because you need signal from both sides separately. A workable floor is around ten conversations per side, and you should treat the two confirmation rates as separate numbers rather than averaging them into one comfortable figure.",
            },
            {
              question: "Do I need a working product to test a marketplace idea?",
              answer:
                "No, and building one early is the most common expensive mistake here. The cold-start problem is a demand and supply question, not a software question. Manual matching over email or a spreadsheet answers whether people want the match at all, which is the thing actually in doubt.",
            },
            {
              question: "What confirmation rate should a marketplace idea hit?",
              answer:
                "The same 50% threshold applies as anywhere else, but it has to hold on the hard side independently. A marketplace where 80% of buyers confirm and 20% of sellers do is not a 50% idea, it is a supply problem wearing an average as a disguise.",
            },
            {
              question: "Is disintermediation always fatal for a marketplace?",
              answer:
                "Not always, but it changes what the business has to be. Marketplaces that survive it usually add something that only works on-platform, such as payment protection, insurance, dispute handling, or reputation that does not travel. If none of those apply to your category, treat leakage as a core risk rather than an edge case.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Test it before you build it",
    body: "Describe the marketplace and we will take it from there. Research and the full scored report cost nothing.",
  },
};
