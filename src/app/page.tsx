import { redirect } from "next/navigation";

/**
 * The marketing surface lives on brains.im (the `web/` app). The root app is
 * the product, so `/` simply sends visitors to the studio; the `(studio)`
 * auth gate routes signed-out visitors to `/sign-in` from there.
 */
export default function HomePage() {
  redirect("/dashboard");
}
