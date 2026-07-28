/**
 * The Fast Track offer must appear at exactly one moment: before the founder
 * has committed to how they'll gather answers. This walks a round through its
 * whole lifecycle and asserts the offer appears and disappears on cue.
 */
import { emptyIdeaState, type IdeaState } from "../src/lib/domain/types";
import { canMarketFastTrack, validationStage } from "../src/lib/validation-stage";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const base = (): IdeaState =>
  emptyIdeaState({
    ideaId: "idea-1",
    title: "Test",
    stageAtEntry: "idea_only",
    rawSubmission: {
      description: "x",
      target_audience: "y",
      product_link: null,
      attachments: [],
    },
  });

type OrderStatus = "pending_sourcing" | "scheduling" | "in_progress" | "completed";

const order = (status: OrderStatus) => ({
  order_id: "o1",
  n_requested: 10,
  cost_per_interview: 4000,
  analysis_fee: 15000,
  total_cost: 55000,
  currency: "usd",
  status,
  scheduled_count: 0,
  completed_count: status === "completed" ? 10 : 0,
});

console.log("\nFast Track offer — when it may be shown\n");

console.log("1. Before a track is chosen (the decision point)");
{
  const s = base();
  check("stage is not_started", validationStage(s) === "not_started", validationStage(s));
  check("offer IS marketed", canMarketFastTrack(s));
}

console.log("\n2. Founder chose to do it themselves");
{
  const s = base();
  s.validation.track = "normal";
  check("stage is self_serve", validationStage(s) === "self_serve", validationStage(s));
  check("offer is NOT marketed mid-round", !canMarketFastTrack(s));
}

console.log("\n3. Checkout opened but not paid");
{
  const s = base();
  s.fast_track_order = order("pending_sourcing");
  check("stage is awaiting_payment", validationStage(s) === "awaiting_payment", validationStage(s));
  check("offer is NOT re-marketed", !canMarketFastTrack(s));
  check("track untouched — founder isn't stranded", s.validation.track === null);
}

console.log("\n4. Paid — we're running it");
{
  const s = base();
  s.validation.track = "fast";
  s.fast_track_order = order("scheduling");
  check("stage is underway", validationStage(s) === "underway", validationStage(s));
  check("offer is NOT marketed to a paying customer", !canMarketFastTrack(s));
}

console.log("\n5. Round delivered");
{
  const s = base();
  s.validation.track = "fast";
  s.fast_track_order = order("completed");
  check("stage is delivered", validationStage(s) === "delivered", validationStage(s));
  check("offer is NOT marketed", !canMarketFastTrack(s));
}

console.log("\n6. Redo — a fork resets track and order");
{
  // Mirrors what forkVersion() writes for a new round.
  const s = base();
  s.validation.track = null;
  s.fast_track_order = null;
  check("stage returns to not_started", validationStage(s) === "not_started", validationStage(s));
  check("offer IS marketed again before they purchase", canMarketFastTrack(s));
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILED`);
if (failures > 0) process.exit(1);
