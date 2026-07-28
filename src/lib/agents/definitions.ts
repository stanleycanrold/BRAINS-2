/**
 * Kept as a re-export so every existing import path still resolves.
 *
 * The agents themselves now live one-per-file in ./catalog, which is what
 * makes them trainable in isolation. New agents belong there, not here.
 */
export * from "./catalog";
