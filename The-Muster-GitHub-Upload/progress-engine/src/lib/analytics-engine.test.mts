import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memberAnalytics } from "./analytics-engine.ts";
import type { HabitReadiness } from "./habit-engine.ts";

const habit = (score: number): HabitReadiness => ({
  action: "Lock today before the day gets away from you.",
  band: score >= 85 ? "Locked in" : score >= 60 ? "Building" : "At risk",
  domains: [],
  score,
  streak: 0,
  weakDomain: "physical",
  weeklyCompleteDays: 0,
});

describe("analytics engine", () => {
  it("returns low risk when signals are clean", () => {
    const analytics = memberAnalytics({
      daysUntilShip: 45,
      habitReadiness: habit(95),
      ptReadiness: "Ready",
      recruiterAnswered: 5,
      recruiterTotal: 6,
      soreness: "low",
      trainingFocus: "balanced",
    });

    assert.equal(analytics.riskLevel, "Low");
    assert.equal(analytics.retentionScore, 100);
    assert.equal(analytics.recruiterPrepRate, 83);
  });

  it("flags high risk from stacked weak signals", () => {
    const analytics = memberAnalytics({
      daysUntilShip: 8,
      habitReadiness: habit(45),
      ptReadiness: "Needs work",
      recruiterAnswered: 1,
      recruiterTotal: 6,
      soreness: "high",
      trainingFocus: "run",
    });

    assert.equal(analytics.riskLevel, "High");
    assert.ok(analytics.retentionScore < 40);
    assert.ok(analytics.priorityReasons.some((reason) => reason.includes("Habit readiness")));
    assert.ok(analytics.priorityReasons.some((reason) => reason.includes("final 14-day")));
  });

  it("turns missing PT baseline into the next best action", () => {
    const analytics = memberAnalytics({
      habitReadiness: habit(75),
      ptReadiness: "No PT logged",
      recruiterAnswered: 6,
      recruiterTotal: 6,
      soreness: "low",
      trainingFocus: "baseline",
    });

    assert.equal(analytics.riskLevel, "Moderate");
    assert.match(analytics.nextAction, /PT baseline/);
  });

  it("keeps recruiter prep rate safe when no questions exist", () => {
    const analytics = memberAnalytics({
      habitReadiness: habit(95),
      ptReadiness: "Ready",
      recruiterAnswered: 0,
      recruiterTotal: 0,
      soreness: "low",
      trainingFocus: "balanced",
    });

    assert.equal(analytics.recruiterPrepRate, 0);
  });
});
