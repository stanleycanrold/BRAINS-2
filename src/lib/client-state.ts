"use client";

import * as React from "react";

/**
 * Hooks for reading browser-only state (localStorage, media queries) during
 * render.
 *
 * The naive version - `useState(false)` plus an effect that reads the real
 * value and calls `setState` - renders twice on every mount and makes the
 * wrong value briefly visible. `useSyncExternalStore` reads the true value on
 * the client while returning an explicit server snapshot, so there is one
 * render and no hydration mismatch.
 */

/** Cross-component notification, so two hooks on the same key stay in step. */
const listeners = new Map<string, Set<() => void>>();

function subscribeToKey(key: string, callback: () => void) {
  let forKey = listeners.get(key);
  if (!forKey) {
    forKey = new Set();
    listeners.set(key, forKey);
  }
  forKey.add(callback);

  // Also react to changes made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) callback();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    forKey.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function notify(key: string) {
  listeners.get(key)?.forEach((callback) => callback());
}

/** A boolean preference persisted in localStorage. */
export function usePersistedFlag(
  key: string,
  serverValue = false,
): readonly [boolean, (next: boolean) => void] {
  const subscribe = React.useCallback(
    (callback: () => void) => subscribeToKey(key, callback),
    [key],
  );

  const value = React.useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) === "1",
    () => serverValue,
  );

  const setValue = React.useCallback(
    (next: boolean) => {
      window.localStorage.setItem(key, next ? "1" : "0");
      notify(key);
    },
    [key],
  );

  return [value, setValue] as const;
}

/** A string preference persisted in localStorage. */
export function usePersistedValue<T extends string>(
  key: string,
  allowed: readonly T[],
  serverValue: T,
): readonly [T, (next: T) => void] {
  const subscribe = React.useCallback(
    (callback: () => void) => subscribeToKey(key, callback),
    [key],
  );

  const value = React.useSyncExternalStore(
    subscribe,
    () => {
      const stored = window.localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored)
        ? (stored as T)
        : serverValue;
    },
    () => serverValue,
  );

  const setValue = React.useCallback(
    (next: T) => {
      window.localStorage.setItem(key, next);
      notify(key);
    },
    [key],
  );

  return [value, setValue] as const;
}

/**
 * A boolean held in sessionStorage - resets when the tab closes.
 *
 * Used for "dismiss this for now" affordances: a founder who waves an offer
 * away today may well want it next week, so persisting it forever is the
 * wrong default.
 */
export function useSessionFlag(
  key: string,
): readonly [boolean, (next: boolean) => void] {
  const subscribe = React.useCallback(
    (callback: () => void) => subscribeToKey(key, callback),
    [key],
  );

  const value = React.useSyncExternalStore(
    subscribe,
    () => window.sessionStorage.getItem(key) === "1",
    () => false,
  );

  const setValue = React.useCallback(
    (next: boolean) => {
      window.sessionStorage.setItem(key, next ? "1" : "0");
      notify(key);
    },
    [key],
  );

  return [value, setValue] as const;
}

/** Live media-query match. Returns `false` on the server. */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
