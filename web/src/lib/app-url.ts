/**
 * Where the product itself lives, for every Log in / Sign up / Get started
 * link on the marketing site.
 *
 * The app repeated a real bug earlier in this project's life: a hardcoded
 * NEXT_PUBLIC_APP_URL that drifted from the port the app was actually
 * running on, so links quietly pointed at a dead address. Read from the env
 * var so production only needs one value set correctly, but default to the
 * app's actual local dev port so links work out of the box while both
 * projects run side by side on this machine.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3001";

export const signInUrl = `${APP_URL}/sign-in`;
export const signUpUrl = `${APP_URL}/sign-up`;
export const dashboardUrl = `${APP_URL}/dashboard`;
