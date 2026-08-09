import type { ContentPage } from "../types";

/**
 * Mobile apps, where the distinguishing failure is distribution rather than
 * demand, and where stated download intent is close to worthless.
 *
 * The check no other page in this track has: whether the thing needs to be
 * an app at all. Requiring an install is a tax most ideas cannot afford.
 */
export const page: ContentPage = {
  slug: "mobile-app-startup-idea",
  track: "business-type",
  updated: "2026-08-08",
  title: "How to validate a mobile app idea before you build it",
  shortTitle: "Mobile app ideas",
  summary:
    "Downloads are free to promise and expensive to earn. Test the channel and the second week, not the idea.",
  metaTitle: "How to validate a mobile app idea before you build it",
  metaDescription:
    "App ideas fail on distribution and day-seven retention, not features. How to test whether anyone comes back, and whether it needs to be an app.",
  tags: ["mobile", "consumer", "distribution", "retention", "evidence"],

  answer: {
    text: "Validating a mobile app means testing distribution and return visits, not appeal. Nobody regrets saying yes to a hypothetical download. Ask instead which app they installed most recently and still open, and how they found it. If you cannot name the channel that reaches your users, you do not have a plan yet.",
    stat: { value: "7", label: "days, the retention question that matters" },
    qualifier:
      "This covers consumer apps found through search or social. An app sold into a company, or one people are told to install by an employer, is a different problem and closer to the SaaS case.",
  },

  tool: {
    heading: "Describe your app idea",
    body: "Say what someone opens it to do and how often. We will research what already exists, write questions about behaviour rather than intent, and score what comes back.",
    facet: { label: "Mobile app ideas" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you build",
      lead: [
        "App store discovery is effectively closed to new entrants without an existing audience, so most of these checks are about how anyone would ever arrive, rather than whether they would like it once there.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "Whether this needs to be an app at all",
              body: "An install is the largest single drop-off in the funnel, and a great many app ideas work as a mobile web page, a shared link, or a message thread. Ask what the app would do that a website open in a browser could not. Push notifications and camera access are real answers. Wanting to be on the home screen is not.",
              badge: { text: "Ask first", tone: "danger" },
            },
            {
              title: "How a stranger would find it",
              body: "Name the specific channel before you build, because it is harder than the product. Search inside the app stores mostly rewards apps that are already popular. Say where the first thousand people come from, and if the answer is that it spreads by word of mouth, ask who tells whom and why they would bother.",
            },
            {
              title: "What brings someone back on day seven without a notification",
              body: "Most downloaded apps are opened once. The honest question is what unfinished thing, recurring need or social obligation pulls a person back a week later on their own. If the only answer is a push notification, you are testing whether people tolerate interruption rather than whether they want the product.",
            },
            {
              title: "What they use today, on their phone, for this",
              body: "Ask to see the home screen and the last few apps opened. Real phone behaviour is visible in a way most habits are not, and it routinely contradicts what people say. The competitor is usually the camera roll, a group chat, or the notes app, none of which anyone lists when asked what they use.",
            },
            {
              title: "Whether the money survives the platform cut",
              body: "Digital purchases inside an app carry a platform commission, and that comes off the top of every subscription. If your model only works at full price, the model does not work. Check this against the price people say they would pay before treating that figure as revenue.",
            },
          ],
        },
      ],
    },

    {
      id: "evidence",
      title: "What counts as evidence here",
      lead: [
        "Download intent is the weakest signal in consumer software. It costs nothing to promise and it predicts almost nothing, which is why the checks below all refer to something that already happened.",
      ],
      blocks: [
        {
          kind: "compare",
          positive: {
            heading: "Counts",
            items: [
              "The last app they installed and still open, with how they found it",
              "An app they paid for on their phone in the last year",
              "A workaround they run through screenshots, notes or a group chat",
              "Someone describing the last time this need came up, and what they did",
              "A named community or creator their whole peer group already follows",
            ],
          },
          negative: {
            heading: "Does not count",
            items: [
              "I would download that",
              "Sure, I would pay a few pounds a month for it",
              "Enthusiasm from someone who has never had the problem unprompted",
              "A signup on a waitlist that asked for nothing else",
              "Friends and family, who are answering about you rather than the app",
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
              question: "How do I validate an app idea without building the app?",
              answer:
                "Run the thing manually for a small group through whatever they already use. A shared spreadsheet, a group chat, or a simple web page will deliver the value without an install, and if the value is real people will keep showing up despite the awkwardness. An idea that cannot hold ten people through a clumsy version will not hold strangers through a polished one.",
            },
            {
              question: "Are waitlist signups good validation for an app?",
              answer:
                "Only weakly, and they are frequently misread. An email address costs nothing and is often given to end an interaction politely. A waitlist becomes meaningful when it asks for something with a cost attached, such as a deposit, a scheduled call, or a detailed description of the problem the person is trying to solve.",
            },
            {
              question: "How many people should I talk to for a consumer app idea?",
              answer:
                "Ten to fifteen is a reasonable floor, and consumer recruiting is usually easier than B2B, so there is little excuse for fewer. Bias the sample toward strangers. Consumer apps attract more agreeable answers from people who know you than almost any other category, because the ask sounds small and disagreeing feels rude.",
            },
            {
              question: "What retention rate should I be looking for?",
              answer:
                "Before launch you cannot measure retention, so test the mechanism instead. Ask what would bring someone back in a week and see whether the answer refers to something in their life rather than something in your product. A person who says they would set a reminder to use it has told you the pull is not there.",
            },
            {
              question: "Should I launch on iOS or Android first?",
              answer:
                "Follow the users you identified rather than a general rule, and let the research answer it. The split varies sharply by country and by income, so the honest input is where your specific audience actually is. Picking based on which is easier to build for is choosing a constraint over a customer.",
            },
            {
              question: "My app idea already exists. Is that fatal?",
              answer:
                "No, and it usually means the demand question is settled. Go and read the reviews of the closest competitor, especially the two and three star ones, because that is where people describe what they wanted and did not get. Then ask that app's users what they still do by hand. A shrug means the gap you saw is not felt by the people living with it.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Test it before you build it",
    body: "Describe the app and who would open it. Research and the full scored report cost nothing.",
  },
};
