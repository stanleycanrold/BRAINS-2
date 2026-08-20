import "server-only";
import { formatMoney } from "@/lib/pricing";
import { emailFromAddress } from "@/lib/stripe";

const PAYMENT_CONFIRMATION_EMAIL = "stanleycanrold@gmail.com";

type PaymentEmailDetails = {
  customerEmail: string;
  ideaTitle: string;
  orderId: string;
  nRequested: number;
  location: string;
  totalCostCents: number;
  currency: string;
  questionsEditUrl: string;
  panelUrl: string | null;
  founderWebsite: string | null;
};

export async function sendFastTrackPaymentEmails(
  details: PaymentEmailDetails,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = emailFromAddress();
  if (!apiKey || !from || !details.customerEmail) return false;

  const amount = formatMoney(details.totalCostCents, details.currency);
  const customerText = [
    "Your BRAINS AI Fast Track order has been placed.",
    "",
    "Payment is confirmed and your validation work has begun. We will source participants, collect responses, and send your finished report when the round is complete.",
    "",
    `Validation idea: ${details.ideaTitle}`,
    `People requested: ${details.nRequested}`,
    `Location: ${details.location || "Anywhere"}`,
    `Amount paid: ${amount}`,
    `Order reference: ${details.orderId}`,
    "",
    `Edit your questions: ${details.questionsEditUrl}`,
    ...(details.panelUrl ? [`Questionnaire link: ${details.panelUrl}`] : []),
    ...(details.founderWebsite
      ? [`Your website: ${details.founderWebsite}`]
      : []),
    "",
    "Questions can be edited before we send them to participants.",
    "Contact us: stanley@nexabrains.io",
  ].join("\n");

  const adminText = [
    "A BRAINS AI Fast Track payment was confirmed manually.",
    "",
    `Customer: ${details.customerEmail}`,
    `Validation idea: ${details.ideaTitle}`,
    `People requested: ${details.nRequested}`,
    `Location: ${details.location || "Anywhere"}`,
    `Amount: ${amount}`,
    `Order reference: ${details.orderId}`,
    `Customer email: ${details.customerEmail}`,
    "",
    `Edit questions: ${details.questionsEditUrl}`,
    ...(details.panelUrl ? [`Questionnaire link: ${details.panelUrl}`] : []),
    ...(details.founderWebsite
      ? [`Founder website: ${details.founderWebsite}`]
      : []),
    "",
    "The order has been marked paid and the work is now in the fast track.",
    "Contact us: stanley@nexabrains.io",
  ].join("\n");

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const [adminResponse, customerResponse] = await Promise.all([
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: [PAYMENT_CONFIRMATION_EMAIL],
        subject: `Payment confirmed: ${details.ideaTitle}`,
        text: adminText,
      }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: [details.customerEmail],
        subject: `Your BRAINS AI order has been placed: ${details.ideaTitle}`,
        text: customerText,
      }),
    }),
  ]);

  if (!adminResponse.ok || !customerResponse.ok) {
    console.error(
      "[Fast Track payment confirmation email]",
      await Promise.all([adminResponse.text(), customerResponse.text()]),
    );
  }

  return adminResponse.ok && customerResponse.ok;
}