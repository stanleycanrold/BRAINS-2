import { redirect } from "next/navigation";

/**
 * Engage is no longer a destination — it's a side panel opened from within an
 * idea, where the drafts actually have context. Old links land here, so send
 * them somewhere useful rather than 404.
 */
export default function EngageRedirect() {
  redirect("/dashboard");
}
