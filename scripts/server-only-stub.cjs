// Preload stub for running server-only app modules under plain tsx scripts.
// `server-only` throws outside Next.js and `next/headers` needs a request
// scope; smoke scripts only need the business logic, so both get shims.
const Module = require("node:module");

const emptyCookiesStore = {
  get: () => undefined,
  getAll: () => [],
  has: () => false,
  set: () => {},
  delete: () => {},
};

const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "server-only") return {};
  if (request === "next/headers") {
    return {
      cookies: async () => emptyCookiesStore,
      headers: async () => new Map(),
    };
  }
  return originalLoad.apply(this, [request, ...rest]);
};
