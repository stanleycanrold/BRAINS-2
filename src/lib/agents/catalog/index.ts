/**
 * The agent catalog.
 *
 * One file per agent, each holding that agent's schema and prompt and nothing
 * else. Splitting them out of a single 667-line module is what makes them
 * trainable in isolation: you can read, version and tune one agent without
 * scrolling past nine others, and a diff to one agent touches one file.
 *
 * Everything is re-exported here so existing imports keep working.
 */

export { VOICE } from "./voice";
export * from "./product-context";
export * from "./extraction";
export * from "./research";
export * from "./signal-scan";
export * from "./questionnaire";
export * from "./synthesis";
export * from "./decision-gate";
export * from "./post-drafting";
export * from "./comment-drafting";
export * from "./monitor";
export * from "./response-quality";
