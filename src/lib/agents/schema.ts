import { z } from "zod";

/**
 * Converts a zod schema into the constrained JSON Schema dialect that
 * strict-decoding providers accept.
 *
 * `io: "output"` is deliberate: it marks defaulted fields as required, which is
 * what we want on the way *out* of a model - every field present, no partial
 * objects to defend against downstream.
 *
 * The sanitiser then removes keywords strict mode rejects (`default`,
 * `$schema`, numeric/string constraints). Those constraints still apply: zod
 * validates the parsed result afterwards, so nothing is lost by omitting them
 * from the decoding grammar.
 */

const ALLOWED_KEYS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const",
  "anyOf",
  "description",
]);

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (node === null || typeof node !== "object") return node;

  const input = node as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    output[key] =
      key === "properties"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [
              k,
              sanitize(v),
            ]),
          )
        : sanitize(value);
  }

  // Objects must be closed for strict decoding.
  if (output.type === "object" && !("additionalProperties" in output)) {
    output.additionalProperties = false;
  }

  return output;
}

export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { io: "output" });
  return sanitize(generated) as Record<string, unknown>;
}
