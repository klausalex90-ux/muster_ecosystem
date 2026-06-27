import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSevenDayTrainingPlan,
  identifyPrimaryFocus,
  normalizeConstraints,
} from "./fitness-engine.ts";

describe("fitness engine", () => {
  it("starts with a baseline plan when no PT score exists", () => {
    const plan = generateSevenDayTrainingPlan({ branch: "Army" });

    assert.equal(plan.primaryFocus, "baseline");
    assert.equal(plan.readiness, "No PT logged");
    assert.equal(plan.sessions.length, 7);
    assert.match(plan.sessions[0].title, /baseline/i);
  });

  it("prioritizes the largest readiness gap", () => {
    assert.equal(
      identifyPrimaryFocus({ plankSeconds: 130, pushups: 20, runSeconds: 890 }),
      "pushups",
    );
    assert.equal(
      identifyPrimaryFocus({ plankSeconds: 130, pushups: 50, runSeconds: 1200 }),
      "run",
    );
    assert.equal(
      identifyPrimaryFocus({ plankSeconds: 45, pushups: 44, runSeconds: 930 }),
      "plank",
    );
  });

  it("switches to taper work near ship date", () => {
    const plan = generateSevenDayTrainingPlan({
      baseline: { plankSeconds: 45, pushups: 10, runSeconds: 1300 },
      branch: "Marine Corps",
      daysUntilShip: 7,
    });

    assert.equal(plan.primaryFocus, "taper");
    assert.equal(plan.sessions[6].focus, "taper");
  });

  it("carries branch assessment context into the plan", () => {
    const plan = generateSevenDayTrainingPlan({
      baseline: { plankSeconds: 120, pushups: 45, runSeconds: 900 },
      branch: "Air Force",
      daysUntilShip: 40,
    });

    assert.equal(plan.primaryFocus, "balanced");
    assert.equal(plan.branchAssessment, "Department of the Air Force Fitness Assessment");
  });

  it("adapts the plan for high soreness", () => {
    const plan = generateSevenDayTrainingPlan({
      baseline: { plankSeconds: 80, pushups: 20, runSeconds: 1200 },
      branch: "Army",
      constraints: { soreness: "high" },
    });

    assert.equal(plan.sessions[0].title, "Active recovery reset");
    assert.match(plan.sessions[0].recovery, /No max testing/);
    assert.ok(plan.adaptationSummary.includes("recovery-first today"));
  });

  it("adds time and equipment substitutions", () => {
    const plan = generateSevenDayTrainingPlan({
      branch: "Navy",
      constraints: { equipment: "none", minutesAvailable: 20, soreness: "moderate" },
    });

    assert.ok(plan.sessions[0].work.some((item) => item.includes("20 minutes")));
    assert.ok(plan.sessions[0].work.some((item) => item.includes("bodyweight")));
    assert.ok(plan.sessions[0].work.some((item) => item.includes("reduce volume by 20%")));
  });

  it("normalizes invalid adaptive inputs", () => {
    const constraints = normalizeConstraints({
      equipment: "garage" as never,
      minutesAvailable: 999,
      soreness: "wild" as never,
    });

    assert.equal(constraints.equipment, "basic");
    assert.equal(constraints.minutesAvailable, 90);
    assert.equal(constraints.soreness, "low");
  });
});
