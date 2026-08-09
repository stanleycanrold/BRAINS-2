import type { ContentPage } from "../types";

/**
 * The head-term page, and the anchor of the validation cluster. Every other
 * question page is a narrower cut of this one, which is why it carries the
 * evidence ladder that the rest refer back to. It will rank slowest and
 * matter longest.
 */
export const page: ContentPage = {
  slug: "how-to-validate-a-startup-idea",
  track: "question",
  updated: "2026-08-04",
  title: "How to validate a startup idea",
  shortTitle: "How to validate a startup idea",
  summary:
    "Find evidence people already spend money or hours on the problem. Ten to fifteen conversations, about two weeks.",
  metaTitle: "How to validate a startup idea (without building it first)",
  metaDescription:
    "Validation means finding evidence the problem already costs people money or hours. The evidence ladder, how many conversations it takes, and what does not count.",
  tags: ["evidence", "process", "interviews", "fundamentals"],

  answer: {
    text: "Validating a startup idea means finding evidence that a specific group of people already spends money or hours on the problem you want to solve. It takes ten to fifteen conversations and about two weeks. You are not testing whether people like your idea. You are testing whether the problem comes up without you naming it first.",
    stat: { value: "10-15", label: "conversations" },
    qualifier:
      "That count is for a single-sided product. A marketplace needs the same again for its second side, and an established product testing one new feature can often stop at six.",
  },

  tool: {
    heading: "Start with your own idea",
    body: "Describe the problem and who has it. We research whether it is real and cite where we found it, write the questions worth asking, and score the answers that come back.",
    starters: [
      {
        label: "I have an idea, no evidence yet",
        seed: "I want to build [what] for [who]. I think their problem is [problem], but I have not checked. Today they handle it by ",
      },
      {
        label: "People say they like it",
        seed: "I have described [idea] to about [number] people and they were positive, but nobody has paid or committed anything. What they said was ",
      },
      {
        label: "I am not sure who it is for",
        seed: "I know the problem is [problem], but I am not sure who has it worst. The people I think might be ",
      },
    ],
  },

  sections: [
    {
      id: "evidence-ladder",
      title: "The evidence ladder",
      lead: [
        "Most bad validation is not lazy. It is a founder collecting real responses and reading them one or two rungs higher than they belong. Rank every conversation by what it cost the other person to say, because that is the only part they cannot fake to be kind.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "They said it sounds like a good idea",
              body: "Worth nothing, and worse than nothing if you count it. Agreement costs the other person no money, no time, and no reputation. It is the single most common piece of evidence founders carry into a two-year build.",
              badge: { text: "Not evidence", tone: "danger" },
            },
            {
              title: "They said they would buy it",
              body: "Still a prediction about a stranger's future behaviour, made by someone being polite to your face. Treat a stated intention to buy as a request for a real chance to buy, and then offer them one.",
              badge: { text: "Not evidence", tone: "danger" },
            },
            {
              title: "They described the problem before you named it",
              body: "The first rung that counts. If you ask what is hard about their week and the problem comes up on its own, it is real enough to occupy their attention when nobody is prompting them. If you had to describe it first, you learned nothing about whether it matters.",
              badge: { text: "Evidence", tone: "success" },
            },
            {
              title: "They showed you the workaround",
              body: "A spreadsheet, a WhatsApp group, a folder of screenshots, an intern doing it by hand. A workaround is proof the problem is expensive enough to have already provoked a solution, and it tells you the real standard you have to beat.",
              badge: { text: "Strong", tone: "success" },
            },
            {
              title: "They committed something before the product existed",
              body: "Money, a deposit, a signed pilot, an introduction to their boss, a recurring slot in their calendar. The commitment does not have to be large. It has to be costly enough that a polite person would decline rather than agree.",
              badge: { text: "Strongest", tone: "success" },
            },
          ],
        },
        {
          kind: "callout",
          text: "Nothing below rung three is evidence. It is encouragement, and encouragement is what funds two-year builds for problems nobody had.",
        },
      ],
    },

    {
      id: "how-to-run-it",
      title: "How to actually run it",
      lead: [
        "Two weeks, five steps. The order matters more than the effort, because two of these steps only work if they happen before you hear any answers.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Write down what you believe, as something that could be wrong",
              body: 'Not "restaurants need better inventory software". That cannot fail. Write "independent restaurant owners lose more than two hours a week reconciling supplier invoices by hand, and it costs them enough to pay to stop". Now there is a claim with an edge, and a conversation can land on either side of it.',
            },
            {
              title: "Decide the kill line before you hear a single answer",
              body: "Write down the result that would make you stop. Something like: if fewer than half the people I talk to raise this without prompting, I drop it. Deciding this afterwards is not validation, it is negotiation, and you will win that negotiation every time.",
            },
            {
              title: "Find people who have the problem this month",
              body: "Not founders, not friends, not anyone who will grade your idea rather than describe their own week. The people worth talking to are the ones currently living inside the problem, which usually means going somewhere they already gather rather than posting about it where you already are.",
            },
            {
              title: "Ask about the last time, never the next time",
              body: '"Would you use this?" produces fiction. "Walk me through the last time this happened" produces a record. This is the core rule of Rob Fitzpatrick\'s The Mom Test, and it holds because memory of a real event is checkable in a way that a prediction never is.',
            },
            {
              title: "Score every conversation against the ladder, same day",
              body: "Write which rung each conversation reached while you still remember the tone. Done a week later, every conversation drifts upward. This is also the point where the pattern shows up: three people describing the same workaround is a far louder signal than ten people agreeing with you.",
            },
          ],
        },
      ],
    },

    {
      id: "mistakes",
      title: "Where this goes wrong",
      lead: [
        "CB Insights has spent years collecting startup post-mortems, and the reason founders name most often is no market need. Almost every one of those companies talked to people first. These are the four ways that happens.",
      ],
      blocks: [
        {
          kind: "cards",
          items: [
            {
              title: "Pitching instead of asking",
              body: "The moment you describe the product, the other person switches from reporting their life to reacting to your idea. Everything after that is contaminated. Keep the product out of the first two thirds of the conversation.",
            },
            {
              title: "Talking to people who are easy to reach",
              body: "Friends, other founders, and your existing network are available and wrong. They are not living in the problem, and most of them will protect the friendship over the finding.",
            },
            {
              title: "Averaging away a bad half",
              body: "If half your market confirms and half does not, you do not have a fifty percent idea. You usually have one segment with the problem and one without it, and the useful move is to find the line between them rather than report the mean.",
            },
            {
              title: "Moving the kill line",
              body: "The kill line only works if it was written first and left alone. Rewriting it once results are in is the most common way a validation exercise produces the answer the founder already had.",
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
              question: "How long should validating an idea take?",
              answer:
                "About two weeks of real effort for a single-sided product. Most of that is finding and scheduling people rather than talking to them. If it has run past a month, the usual cause is not thoroughness, it is that the answer arrived early and was unwelcome.",
            },
            {
              question: "Can I validate an idea without talking to anyone?",
              answer:
                "Partly. Desk research tells you who already serves this market, what they charge, and what people complain about in public. It cannot tell you whether a specific person will change what they do. Search gets you to a sharper question; only conversations answer it.",
            },
            {
              question:
                "People say they love it but nobody has paid. What does that mean?",
              answer:
                "It usually means the problem is recognisable but not expensive. People will happily agree that something is annoying without it being costly enough to change their week over. The test is to ask for something small and real, such as a deposit or a scheduled pilot, and to take a soft refusal as the actual answer.",
            },
            {
              question: "Do I need a prototype or landing page before I start?",
              answer:
                "No, and building one first tends to skip the step that matters. A landing page measures whether your description is compelling, which is a copywriting result. Conversations measure whether the problem is real, which is the thing in doubt. Do the conversations first, then build the page to test the pitch.",
            },
            {
              question: "What if a company is already doing this?",
              answer:
                "That is usually good news and almost never a reason to stop. An existing product proves somebody funded the problem. The question shifts from whether the problem is real to why the current answer leaves people unhappy, which is a far more specific thing to go and ask about.",
            },
            {
              question: "When do I stop validating and start building?",
              answer:
                "When new conversations stop surprising you and at least a few people have reached rung four or five. Concretely: three conversations in a row that add nothing you have not already heard, plus somebody who has committed money, time, or access before the product exists.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Find out which rung your idea is on",
    body: "Describe the problem and who has it. The research and the full scored report cost nothing.",
  },
};
