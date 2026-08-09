import type { ContentPage } from "../types";

/**
 * AI products, where the distinguishing failure is that the demo lands and
 * the habit never forms.
 *
 * The organising question is the cost of a wrong answer, because that single
 * figure decides whether current model reliability is adequate, and no
 * amount of enthusiasm for the demo changes it.
 */
export const page: ContentPage = {
  slug: "ai-app-startup-idea",
  track: "business-type",
  updated: "2026-08-08",
  title: "How to validate an AI app idea before you build it",
  shortTitle: "AI app ideas",
  summary:
    "Ask what a wrong answer costs them. Demo enthusiasm is not evidence, and error tolerance decides the business.",
  metaTitle: "How to validate an AI app idea before you build it",
  metaDescription:
    "AI products fail on error tolerance and habit, not capability. How to test whether people will trust the output enough to change what they do.",
  tags: ["ai", "saas", "differentiation", "interviews", "evidence"],

  answer: {
    text: "Validating an AI product means testing tolerance for wrong answers, not excitement about right ones. Ask what an error costs the person who acts on it. A demo that impresses people who then keep doing the task by hand has told you nothing, because trying something once is not the same as relying on it.",
    stat: { value: "1", label: "question: what does a wrong answer cost" },
    qualifier:
      "This applies where the model produces something a person acts on. If the output is entertainment or a first draft nobody ships unread, error tolerance is high and the harder question is whether anyone returns.",
  },

  tool: {
    heading: "Describe your AI idea",
    body: "Say what it decides or produces, and who acts on the output. We will research what already exists, write questions that test trust rather than curiosity, and score what comes back.",
    facet: { label: "AI app ideas" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you build",
      lead: [
        "AI ideas attract more enthusiasm per conversation than any other category right now, and that enthusiasm is the least reliable signal in this document. These checks exist to get underneath it.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "What a wrong answer costs the person who acts on it",
              body: "This is the question the whole idea turns on. A wrong suggestion in a brainstorming tool costs a second of attention. A wrong figure in a filing costs a penalty and somebody's job. The second case needs a reliability current models may not reach, and no amount of prompt work closes that gap. Get the answer in consequences, not adjectives.",
            },
            {
              title: "Whether they would check the output anyway",
              body: "If a careful person would verify every result before using it, you have not removed the work, you have added a review step to it. That can still be valuable when reviewing is faster than doing. Ask them to estimate both, because a tool that saves nothing after verification is a demo rather than a product.",
            },
            {
              title: "What happens when the model provider ships this",
              body: "A meaningful share of AI product ideas are a system prompt away from being a feature of something the buyer already pays for. Ask what tools they already use that have started adding AI features, and what would happen to your product if the nearest one added this next quarter. An answer of nothing much is a finding.",
            },
            {
              title: "What it costs you to answer one query",
              body: "Unlike ordinary software, serving a user has a real marginal cost here, and heavy users cost the most while paying the same. Estimate cost per query against the price you have in mind before you interview anyone, so you know which answers about willingness to pay are actually viable and which are pleasant but unaffordable.",
            },
            {
              title: "Who does this today, and whether they are unhappy",
              body: "Most AI ideas automate something a person currently does and is often fine at. The buyer may be perfectly satisfied with that arrangement. Find out who holds the task now, whether anyone has complained about it, and what the person doing it thinks. Displacing a competent human is a much harder sell than filling a gap nobody covers.",
            },
          ],
        },
        {
          kind: "callout",
          text: "Ask what a wrong answer costs them. If the honest answer is a lot, enthusiasm for the demo is not evidence.",
        },
      ],
    },

    {
      id: "evidence",
      title: "What counts as evidence here",
      lead: [
        "The pattern to watch for is the second week. Almost everyone will try an AI tool once. What matters is who was still using it after the novelty wore off, and for AI specifically that gap is unusually wide.",
      ],
      blocks: [
        {
          kind: "checklist",
          items: [
            "A stated consequence for a wrong answer, in money, time or liability",
            "Someone describing an AI tool they adopted and then quietly stopped using, and why",
            "An estimate of how long verifying the output would take them",
            "Evidence they already pay for the manual version of this work",
            "A specific account of the last time this task went wrong without AI",
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
              question: "How do I validate an AI idea when people are excited about anything with AI in it?",
              answer:
                "Stop asking about your product and ask about their last month. What did they try, what did they keep, and what did they abandon after a week. Adoption history for AI tools is unusually informative right now precisely because so many people have tried several and kept almost none, so the pattern of what survived tells you more than any reaction to your idea.",
            },
            {
              question: "Is a thin wrapper around a model a real business?",
              answer:
                "Sometimes, but not because of the model. It works when the value sits in something the model does not give you, such as access to data nobody else has, a workflow that has to integrate with systems the provider will never touch, or a regulated context where somebody has to be accountable for the output. Test which of those you have before building, because the wrapper itself is not defensible.",
            },
            {
              question: "How accurate does my AI product need to be?",
              answer:
                "That is set by the cost of an error, not by a benchmark. Where a mistake is cheap and visible, people tolerate a surprising amount of wrongness because they catch it themselves. Where a mistake is expensive or invisible until later, the bar rises steeply and often past what is currently achievable. Establish the consequence first, then judge whether you can meet it.",
            },
            {
              question: "Should I build the AI part before validating?",
              answer:
                "No, and this is the category where that mistake is most expensive. You can test the value of the output by producing it manually for a handful of people, which is slow and does not scale and is exactly the point. If nobody changes what they do when the answer is correct and delivered by a human, the model was never the missing piece.",
            },
            {
              question: "How do I test willingness to pay for an AI tool?",
              answer:
                "Anchor on what the manual work costs rather than on what other AI tools charge. Comparing against other AI pricing imports assumptions from products with different unit costs and different buyers. The hours currently spent on the task, at the rate of whoever spends them, is the number that survives contact with a budget conversation.",
            },
            {
              question: "What if my AI idea already exists?",
              answer:
                "That is usually good news, because it means somebody validated the demand for you. The question becomes why the existing tools are not enough for the specific people you would serve. Find users of the closest competitor and ask what they still do by hand despite paying for it, and treat a shrug as evidence that the gap you imagined is not felt.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Test it before you build it",
    body: "Describe what the product decides and who acts on it. Research and the full scored report cost nothing.",
  },
};
