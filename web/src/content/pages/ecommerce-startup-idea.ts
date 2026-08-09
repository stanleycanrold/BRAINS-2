import type { ContentPage } from "../types";

/**
 * Physical products, the one track where demand is usually not the binding
 * constraint and arithmetic is.
 *
 * The page is organised around contribution margin rather than around
 * interviews, because a product people genuinely want can still be a losing
 * business, and no number of confirming conversations will reveal that.
 */
export const page: ContentPage = {
  slug: "ecommerce-startup-idea",
  track: "business-type",
  updated: "2026-08-08",
  title: "How to validate an ecommerce or physical product idea",
  shortTitle: "Physical products",
  summary:
    "Wanting it is not the constraint. What survives after landed cost, shipping, returns and acquisition is.",
  metaTitle: "How to validate an ecommerce or physical product idea",
  metaDescription:
    "Physical products fail on unit economics, not demand. How to work out what survives after cost, shipping, returns and acquisition, before you order stock.",
  tags: ["ecommerce", "consumer", "unit-economics", "pricing", "evidence"],

  answer: {
    text: "Demand is rarely what kills a physical product. Arithmetic is. Work out the landed cost of one unit, then subtract shipping, returns and what it costs to acquire the buyer. If what remains does not cover a second order's acquisition, you have a hobby with inventory rather than a business.",
    stat: { value: "2", label: "orders, the point where paid acquisition works or does not" },
    qualifier:
      "This assumes you are selling online and buying traffic. Selling through wholesale, a market stall or an existing audience changes the acquisition term substantially and can rescue margins that fail here.",
  },

  tool: {
    heading: "Describe your product idea",
    body: "Say what it is, who buys it and roughly what it costs you to make. We will research the alternatives and their pricing, write the questions worth asking, and score what comes back.",
    facet: { label: "Physical products" },
  },

  sections: [
    {
      id: "checks",
      title: "Five things to check before you order stock",
      lead: [
        "Every check below can be done on paper, before any money is committed to inventory. That is the whole advantage available to you here, and it is routinely skipped in favour of asking people whether they like the product.",
      ],
      blocks: [
        {
          kind: "steps",
          items: [
            {
              title: "The landed cost of one unit, not the factory quote",
              body: "The unit price a supplier quotes is the beginning. Add freight, duty, packaging, and the fraction of your minimum order that never sells. Founders routinely build a business case on the quoted figure and discover the real one after committing to stock, at which point the price they planned to charge no longer works.",
              badge: { text: "Do this first", tone: "success" },
            },
            {
              title: "What shipping actually costs, both ways",
              body: "Delivery is expected to be free or near it, which means it comes out of your margin rather than the customer's pocket. Cost it honestly for your heaviest, most awkward variant, and include the return leg. A bulky low-priced item can be uneconomic to ship before anything else is considered.",
            },
            {
              title: "Your return rate, by category",
              body: "Returns vary enormously by what you sell. Anything sized, fitted, or judged on colour comes back at rates that can consume the entire margin, and a returned item is often not resellable. Find out what is normal for your specific category and treat that as a cost line rather than an edge case.",
            },
            {
              title: "What it costs to acquire one buyer",
              body: "If you are selling online to strangers, you are buying attention, and that price is set by whoever else is bidding for the same customer. Look at what the established sellers in your category are doing and assume you will pay more than they do at first, because you have no data and no reviews.",
            },
            {
              title: "How often the same person buys again",
              body: "This is the term that decides whether paid acquisition ever works. If someone buys once every five years, every sale must be profitable on its own, which is a brutal constraint. If they buy monthly, you can afford to lose money on the first order. Establish which world you are in before you model anything.",
            },
          ],
        },
        {
          kind: "callout",
          text: "A product people love that loses four pounds a unit is not an early stage business. It is a subsidy you are paying strangers to accept.",
        },
      ],
    },

    {
      id: "evidence",
      title: "What counts as evidence here",
      lead: [
        "Interviews still matter, but they answer a narrower question than in software. Ask about purchases that already happened, because a price someone endorses in conversation is not a price they have ever paid.",
      ],
      blocks: [
        {
          kind: "compare",
          positive: {
            heading: "Counts",
            items: [
              "What they paid for the nearest comparable thing, with a figure",
              "A pre-order or deposit at your real intended price",
              "Someone describing what is wrong with what they currently buy",
              "How often they replace or repurchase this kind of item",
              "A supplier quote you have actually received, with freight included",
            ],
          },
          negative: {
            heading: "Does not count",
            items: [
              "I would definitely buy that",
              "A price someone names without being asked to pay it",
              "Interest at a price below your landed cost",
              "Compliments on the design from people who are not the buyer",
              "Social engagement on a product photo",
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
              question: "How do I validate a physical product without manufacturing it?",
              answer:
                "Sell it before it exists, at the real price, with an honest delivery date. A pre-order page collecting actual payment is the strongest signal available and costs far less than a production run. If that feels dishonest, it is worth noticing that taking money for something you have not made is exactly what you are proposing to do at scale.",
            },
            {
              question: "How many people should I talk to for a product idea?",
              answer:
                "Fewer conversations than software needs, and more arithmetic. Ten conversations will tell you whether the problem and the price are plausible. After that the binding questions are landed cost, return rate and acquisition cost, none of which improve with a larger interview sample because none of them are opinions.",
            },
            {
              question: "What margin do I need for an ecommerce business to work?",
              answer:
                "Enough that contribution margin after shipping and returns covers acquisition cost with room left over, which for a one-off purchase usually means the retail price is a large multiple of landed cost. Work backwards from your own numbers rather than adopting a rule of thumb, since the required multiple depends entirely on how often people repurchase.",
            },
            {
              question: "Is a crowdfunding campaign good validation?",
              answer:
                "It is strong evidence on demand and price, since backers pay real money before the product exists. It is weak evidence on unit economics, because campaign backers are unusually motivated and you did not pay to acquire most of them. Treat a funded campaign as proof people want it, not as proof you can sell it profitably to strangers afterwards.",
            },
            {
              question: "Should I sell on a marketplace or my own store?",
              answer:
                "A large marketplace brings buyers you would otherwise pay to reach, and takes a commission plus your relationship with the customer. Your own store keeps both and requires you to generate every visit yourself. The right answer depends on the acquisition cost you calculated, and the commission is usually cheaper than advertising at the start.",
            },
            {
              question: "My product idea already exists on Amazon. Should I stop?",
              answer:
                "Not necessarily, but your differentiation now has to be visible in a photograph and a title, because that is all a buyer compares. Read the one and two star reviews of the closest sellers, since that is where people describe precisely what failed. If the complaints are about things you cannot fix at your cost base, that is a finding worth taking seriously.",
            },
          ],
        },
      ],
    },
  ],

  cta: {
    heading: "Check the numbers before you order stock",
    body: "Describe the product and who buys it. Research and the full scored report cost nothing.",
  },
};
