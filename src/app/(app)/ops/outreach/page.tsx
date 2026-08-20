import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOpsUser } from "@/lib/auth";
import { getOutreachRecipients } from "@/lib/outreach";
import { OpsTopBar } from "../OpsTopBar";
import { OutreachView } from "./OutreachView";

export const metadata: Metadata = { title: "Outreach" };

export default async function OutreachPage() {
  if (!(await isOpsUser())) redirect("/dashboard");
  const recipients = await getOutreachRecipients();

  return (
    <>
      <OpsTopBar />
      <OutreachView
        testRecipient="stanleycanrold@gmail.com"
        recipients={recipients.map((recipient) => ({
          email: recipient.email,
          product: recipient.product,
          greeting: recipient.greeting,
          subject: recipient.subject,
        }))}
      />
    </>
  );
}